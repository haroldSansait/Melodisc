export function getFriendlyErrorMessage(errorCode: string) {
  const errorMessages: Record<string, string> = {
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/popup-closed-by-user': 'Login cancelled.',
    'auth/invalid-credential': 'Incorrect email or password. Please try again.',
    'auth/email-already-in-use': 'An account already exists with this email.',
    'auth/weak-password': 'Password should be at least 6 characters.',
  };

  return errorMessages[errorCode] ?? 'Something went wrong. Please try again.';
}
