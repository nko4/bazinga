module.exports = {
  unamePattern: "Darwin Kernel Version 13.0.0",
  tool: "vmstat",
  command: "vm_stat",
  args: ["{{updateInterval}}"],
  ignorePatterns: [/Mach Virtual Memory Statistics/],
  totals: true,
  renderingConfig: {
    order: ["totals", "pages", "compressor", "swap"],
    charts: {
      totals: {
        type: "stacked",
        fields: ["free", "active", "inactive", "specul", "throttle", "wired", "prgable"],
      },
      pages: {
        type: "line",
        fields: ["faults", "copy", "0fill", "reactive", "purged", "file-backed", "anonymous"]
      },
      compressor: {
        type: "line",
        fields: ["cmprssed", "cmprssor", "dcomprs", "comprs"]
      },
      swap: {
        type: "line",
        fields: ["pageins", "pageout", "swapins", "swapouts"]
      }
    }
  }
};
