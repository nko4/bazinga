module.exports = {
  unamePattern: "GNU/Linux",
  tool: "vmstat",
  command: "vmstat",
  args: ["{{updateInterval}}"],
  ignorePatterns: [],
  renderingConfig: {
    order: ["procs", "memory", "swap", "io", "system", "cpu"],
    charts: {
      procs: {
        type: "line",
        fields: ["r", "b"],
      },
      memory: {
        type: "stacked",
        fields: ["swpd", "free", "buff", "cache"]
      },
      swap: {
        type: "line",
        fields: ["si", "so"]
      },
      io: {
        type: "line",
        fields: ["bi", "bo"]
      },
      system: {
        type: "line",
        fields: ["in", "cs", "us"]
      },
      cpu: {
        type: "line",
        fields: ["sy", "id", "wa"]
      }
    }
  }
};
