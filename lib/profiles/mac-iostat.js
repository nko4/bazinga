// TODO Support more than 1 disk
module.exports = {
  unamePattern: "Darwin Kernel Version 13.0.0",
  tool: "iostat",
  command: "iostat",
  args: ["{{updateInterval}}"],
  ignorePatterns: ["load average"],
  totals: true,
  renderingConfig: {
    order: ["disk", "cpu", "load-average"],
    charts: {
      disk: {
        type: "line",
        fields: ["KB/t", "tps", "MB/s"],
      },
      cpu: {
        type: "stacked",
        fields: ["us", "sy", "id"]
      },
      "load-average": {
        type: "line",
        fields: ["1m", "5m", "15m"]
      }
    }
  }
};
