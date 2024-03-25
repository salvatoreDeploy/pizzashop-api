export class LinkExpiredError extends Error {
  constructor() {
    super('Auth link expired, please generate a new code')
  }
}
