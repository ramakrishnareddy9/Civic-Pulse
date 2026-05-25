package com.civicpulse.model.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponseDto<T>(
        boolean success,
        String message,
        T data,
        String error,
        LocalDateTime timestamp
) {
    public static <T> ApiResponseDto<T> success(T data, String message) {
        return new ApiResponseDto<>(true, message, data, null, LocalDateTime.now());
    }

    public static <T> ApiResponseDto<T> success(T data) {
        return success(data, "Success");
    }

    public static <T> ApiResponseDto<T> error(String error) {
        return new ApiResponseDto<>(false, null, null, error, LocalDateTime.now());
    }

    public static <T> ApiResponseDto<T> error(String message, String error) {
        return new ApiResponseDto<>(false, message, null, error, LocalDateTime.now());
    }
}
