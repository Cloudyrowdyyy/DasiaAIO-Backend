# Build stage
FROM rust:1.93.1-bookworm as builder

WORKDIR /app

# Copy manifests and source
COPY Cargo.toml .
COPY src ./src

# Disable SQLx compile-time checking (no database available during build)
ENV SQLX_OFFLINE=true

# Build the application
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/target/release/server /app/server

EXPOSE 5000

ENV RUST_LOG=info

CMD ["/app/server"]
