// Strategy pattern: the strategy contract.
// The application has three reports. They read the same stock ledger, but each
// report has its own query, calculation and result structure.
// Each report is a strategy class with one method: generate(params).
// ReportService chooses the strategy by the report name and calls generate().
export class ReportStrategy {
  async generate(params) {
    throw new Error(`${this.constructor.name} must implement generate`);
  }
}
