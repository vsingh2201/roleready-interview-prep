package com.roleready.auth;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.JsonNode;
import com.roleready.common.JwtUtil;
import com.roleready.user.User;
import com.roleready.user.UserRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth/github")
@RequiredArgsConstructor
public class GitHubOAuthController {

    private static final String ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token";
    private static final String PROFILE_URL = "https://api.github.com/user";

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.github.client-id}")
    private String clientId;

    @Value("${app.github.client-secret}")
    private String clientSecret;

    @GetMapping("/callback")
    public ResponseEntity<AuthResponse> callback(@RequestParam("code") String code) {
        String accessToken = exchangeCodeForAccessToken(code);
        JsonNode profile = fetchGitHubProfile(accessToken);

        String githubId = String.valueOf(profile.get("id").asLong());
        String githubUsername = profile.path("login").asText(null);
        String name = profile.hasNonNull("name") ? profile.get("name").asText() : githubUsername;
        String email = profile.hasNonNull("email")
                ? profile.get("email").asText()
                : githubUsername + "@users.noreply.github.com";

        User user = userRepository.findByGithubId(githubId)
                .orElseGet(() -> userRepository.save(User.builder()
                        .githubId(githubId)
                        .githubUsername(githubUsername)
                        .name(name)
                        .email(email)
                        .build()));

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());
        return ResponseEntity.ok(new AuthResponse(token, user.getId(), user.getEmail(), user.getName()));
    }

    private String exchangeCodeForAccessToken(String code) {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> body = Map.of(
                "client_id", clientId,
                "client_secret", clientSecret,
                "code", code);

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<JsonNode> response = restTemplate.postForEntity(ACCESS_TOKEN_URL, entity, JsonNode.class);

        JsonNode responseBody = response.getBody();
        if (responseBody == null || !responseBody.hasNonNull("access_token")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Failed to exchange GitHub code for token");
        }
        return responseBody.get("access_token").asText();
    }

    private JsonNode fetchGitHubProfile(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        HttpEntity<Void> entity = new HttpEntity<>(headers);
        ResponseEntity<JsonNode> response = restTemplate.exchange(
                PROFILE_URL, HttpMethod.GET, entity, JsonNode.class);

        JsonNode body = response.getBody();
        if (body == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Failed to fetch GitHub profile");
        }
        return body;
    }
}
