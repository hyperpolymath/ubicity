# Retained per standards#102 rule 3 (KEEP+DEP). guix.scm is a
# node-build-system shell with no declared inputs; the sealed
# Containerfile is Deno-only. This flake's devShell is the SOLE source
# of the Rust + WASM toolchain (rust-overlay rustToolchain with the
# wasm32-unknown-unknown target, wasm-pack, wasm-bindgen-cli,
# binaryen/wasm-opt) and the ReScript build chain (rescript, nodejs,
# just, cargo-watch). Remove only once a Guix-side Rust/WASM/ReScript
# story exists.
{
  description = "UbiCity - Learning Capture System (RSR-Compliant)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, flake-utils, rust-overlay }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        overlays = [ (import rust-overlay) ];
        pkgs = import nixpkgs {
          inherit system overlays;
        };

        # Rust with WASM target
        rustToolchain = pkgs.rust-bin.stable.latest.default.override {
          targets = [ "wasm32-unknown-unknown" ];
        };

        # ReScript from npm (using nodePackages)
        rescript = pkgs.nodePackages.rescript or (pkgs.buildNpmPackage rec {
          pname = "rescript";
          version = "11.0.0";
          src = pkgs.fetchurl {
            url = "https://registry.npmjs.org/rescript/-/rescript-${version}.tgz";
            hash = "sha256-placeholder";  # Replace with actual hash
          };
          npmDepsHash = "sha256-placeholder";  # Replace with actual hash
        });

      in
      {
        # Development shell
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Deno
            deno

            # Rust + WASM
            rustToolchain
            wasm-pack
            wasm-bindgen-cli
            binaryen  # wasm-opt

            # ReScript
            nodejs
            nodePackages.npm
            rescript

            # Build tools
            just
            git

            # Optional tools
            nixpkgs-fmt
            cargo-watch
          ];

          shellHook = ''
            echo "🏙️  UbiCity Development Environment"
            echo ""
            echo "Available commands:"
            echo "  just setup  - Setup development environment"
            echo "  just build  - Build ReScript + WASM"
            echo "  just test   - Run tests"
            echo "  just --list - Show all commands"
            echo ""
            echo "Versions:"
            echo "  Deno:     $(deno --version | head -1)"
            echo "  Rust:     $(rustc --version)"
            echo "  ReScript: $(rescript -version 2>/dev/null || echo 'Not found')"
            echo "  Node:     $(node --version)"
            echo ""

            # Set WASM target
            export CARGO_BUILD_TARGET="wasm32-unknown-unknown"

            # Add local bin to PATH
            export PATH="$PWD/bin:$PATH"
          '';

          # Environment variables
          DENO_DIR = "./.deno";
          CARGO_HOME = "./.cargo";
          RUST_SRC_PATH = "${rustToolchain}/lib/rustlib/src/rust/library";
        };

        # Package derivation
        packages.default = pkgs.stdenv.mkDerivation {
          pname = "ubicity";
          version = "0.3.0";

          src = ./.;

          buildInputs = with pkgs; [
            deno
            rustToolchain
            nodejs
            rescript
          ];

          buildPhase = ''
            # Build ReScript
            rescript build

            # Build WASM
            cd wasm
            cargo build --release --target wasm32-unknown-unknown
            cd ..

            # Optimize WASM
            wasm-opt -Oz -o wasm/pkg/ubicity_bg.wasm \
              wasm/target/wasm32-unknown-unknown/release/ubicity_wasm.wasm

            # Cache Deno dependencies
            deno cache --reload src/index.ts
          '';

          installPhase = ''
            mkdir -p $out/bin
            mkdir -p $out/share/ubicity

            # Copy source
            cp -r src src-rescript wasm $out/share/ubicity/
            cp deno.json justfile $out/share/ubicity/

            # Create wrapper scripts
            cat > $out/bin/ubicity <<EOF
            #!/bin/sh
            exec ${pkgs.deno}/bin/deno run \\
              --allow-read --allow-write \\
              $out/share/ubicity/src/cli.ts "\$@"
            EOF
            chmod +x $out/bin/ubicity

            cat > $out/bin/ubicity-capture <<EOF
            #!/bin/sh
            exec ${pkgs.deno}/bin/deno run \\
              --allow-read --allow-write \\
              $out/share/ubicity/src/capture.ts "\$@"
            EOF
            chmod +x $out/bin/ubicity-capture
          '';

          meta = with pkgs.lib; {
            description = "Learning capture system for informal urban education";
            homepage = "https://github.com/Hyperpolymath/ubicity";
            license = with licenses; [ mit ];  # Dual MIT / Palimpsest
            maintainers = [];  # Add maintainers here
            platforms = platforms.unix;
          };
        };

        # Formatter
        formatter = pkgs.nixpkgs-fmt;

        # Apps
        apps = {
          ubicity = {
            type = "app";
            program = "${self.packages.${system}.default}/bin/ubicity";
          };
          capture = {
            type = "app";
            program = "${self.packages.${system}.default}/bin/ubicity-capture";
          };
        };

        # Checks (tests)
        checks = {
          build = self.packages.${system}.default;

          test = pkgs.runCommand "ubicity-tests" {
            buildInputs = [ pkgs.deno ];
          } ''
            cd ${./.}
            ${pkgs.deno}/bin/deno test --allow-read --allow-write tests/
            touch $out
          '';
        };
      }
    );
}
