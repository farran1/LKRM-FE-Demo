import React, { Suspense } from 'react'
import ResetPassword from './reset-password'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPassword />
    </Suspense>
  )
}





