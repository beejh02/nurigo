package kr.co.nurigo.api.web;

import java.util.stream.Collectors;

import jakarta.validation.ConstraintViolationException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import kr.co.nurigo.api.marketboundary.BoundaryConflictException;
import kr.co.nurigo.api.marketboundary.BoundaryNotFoundException;
import kr.co.nurigo.api.marketboundary.InvalidBoundaryException;
import kr.co.nurigo.api.marketboundary.MarketNotFoundException;

@RestControllerAdvice
public class ApiExceptionHandler {

  @ExceptionHandler({MarketNotFoundException.class, BoundaryNotFoundException.class})
  ResponseEntity<ApiError> handleNotFound(RuntimeException exception) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(error(exception));
  }

  @ExceptionHandler(BoundaryConflictException.class)
  ResponseEntity<ApiError> handleConflict(BoundaryConflictException exception) {
    return ResponseEntity.status(HttpStatus.CONFLICT)
        .body(error(exception));
  }

  @ExceptionHandler(InvalidBoundaryException.class)
  ResponseEntity<ApiError> handleInvalidBoundary(InvalidBoundaryException exception) {
    return ResponseEntity.unprocessableContent()
        .body(error(exception));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<ApiError> handleBeanValidation(MethodArgumentNotValidException exception) {
    String message = exception.getBindingResult().getFieldErrors().stream()
        .map(error -> error.getField() + ": " + error.getDefaultMessage())
        .distinct()
        .collect(Collectors.joining(", "));

    return ResponseEntity.unprocessableContent()
        .body(new ApiError("INVALID_BOUNDARY", message));
  }

  @ExceptionHandler(ConstraintViolationException.class)
  ResponseEntity<ApiError> handleConstraintViolation(ConstraintViolationException exception) {
    return ResponseEntity.badRequest()
        .body(new ApiError("INVALID_REQUEST", exception.getMessage()));
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  ResponseEntity<ApiError> handleUnreadableBody(HttpMessageNotReadableException exception) {
    return ResponseEntity.badRequest()
        .body(new ApiError("MALFORMED_JSON", "요청 본문이 올바른 JSON이 아닙니다."));
  }

  private ApiError error(RuntimeException exception) {
    if (exception instanceof MarketNotFoundException marketNotFound) {
      return new ApiError(marketNotFound.code(), marketNotFound.getMessage());
    }

    if (exception instanceof BoundaryNotFoundException boundaryNotFound) {
      return new ApiError(boundaryNotFound.code(), boundaryNotFound.getMessage());
    }

    if (exception instanceof BoundaryConflictException conflict) {
      return new ApiError(conflict.code(), conflict.getMessage());
    }

    if (exception instanceof InvalidBoundaryException invalid) {
      return new ApiError(invalid.code(), invalid.getMessage());
    }

    return new ApiError("UNEXPECTED_ERROR", exception.getMessage());
  }
}
