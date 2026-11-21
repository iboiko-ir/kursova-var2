// This is the strategy contract. Each report makes its own result.
export class ReportStrategy {
  async generate(params) {
    throw new Error(`${this.constructor.name} must implement generate`);
  }
}
