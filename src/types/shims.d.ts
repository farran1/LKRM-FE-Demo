declare module 'bcryptjs' {
  const bcrypt: any
  export default bcrypt
}

declare module 'jsonwebtoken' {
  const jwt: any
  export default jwt
  export type JsonWebTokenError = any
  export type TokenExpiredError = any
}


