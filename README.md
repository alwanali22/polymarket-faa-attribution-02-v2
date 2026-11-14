# Polymarket FAA Attribution Forecaster

This program forecasts Polymarket Yes prices for FAA outage attribution markets, following the design specification for competition polymarket-faa-attribution-02.

## Model
The model uses a persistent median (the last observed price) and per-market sigma calculated from the last 120 one-minute price differences, with a spread that saturates over time using a kappa value of 0.008.

## How to run locally
1. Set the input and output directories:
   ```bash
   export MAKEFUN_INPUT_DIR=/path/to/input
   export MAKEFUN_OUTPUT_DIR=/path/to/output
   ```
2. Run the program:
   ```bash
   node repo/main.ts
   ```
