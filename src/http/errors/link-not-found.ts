export class LinkNotFoundError extends Error {
  constructor() {
    super('Auth link not found')
  }
}
