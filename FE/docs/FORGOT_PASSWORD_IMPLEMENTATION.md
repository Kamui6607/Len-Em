# Forgot Password Flow Implementation

## Overview
Complete forgot password flow implementation for Yarn-Shop frontend, allowing users to reset their password via email link.

## Flow Diagram

```
Forgot Password Page (/auth/forgot-password)
    │
    │ User enters email
    ▼
POST /mail/forgot-password/send
    │
    │ Success: Email sent with reset link
    ▼
User receives email with link
    │
    │ User clicks link
    ▼
Reset Password Page (/auth/reset-password?uuid=xxx)
    │
    │ Auto-verifies UUID via POST /mail/forgot-password/verify
    ▼
User enters new password
    │
    │ Submit form
    ▼
POST /auth/forgot-password
    │
    │ Success: Password reset
    ▼
Redirect to Login Page
```

## API Endpoints Used

### 1. Send Forgot Password Email
- **Endpoint**: `POST /mail/forgot-password/send`
- **Authentication**: Not required
- **Request Body**: `{ "email": "user@example.com" }`
- **Response**: `{ "status": "success", "message": "Reset password link sent successfully" }`
- **Implementation**: `authService.sendForgotPasswordEmail(email)`

### 2. Verify Password Reset Link
- **Endpoint**: `POST /mail/forgot-password/verify?uuid={uuid}`
- **Authentication**: Not required
- **Query Params**: `uuid` - UUID from reset link
- **Response**: `{ "status": "success", "message": "Link verified!", "isValid": "user@example.com" }`
- **Implementation**: `authService.verifyForgotPasswordLink(uuid)`

### 3. Reset Password
- **Endpoint**: `PATCH /auth/forgot-password`
- **Authentication**: Not required (requires valid UUID)
- **Request Body**: `{ "uuid": "xxx", "newPassword": "newpassword123" }`
- **Response**: `{ "status": "success", "message": "Password reset successfully" }`
- **Implementation**: `authService.forgotPassword({ uuid, newPassword })`

## Files Created/Modified

### Created Files
1. **src/pages/auth/ResetPasswordPage.tsx** - Password reset page component
   - Handles UUID verification on mount
   - Displays loading state while verifying
   - Shows error state for invalid/expired links
   - Provides form for new password entry
   - Validates password matching and minimum length
   - Shows success state after reset

### Modified Files
1. **src/services/auth.service.ts**
   - Added `verifyForgotPasswordLink(uuid: string)` method
   - Calls `POST /mail/forgot-password/verify?uuid={uuid}`

2. **src/routes/AppRouter.tsx**
   - Added lazy import for `ResetPasswordPage`
   - Added route: `/auth/reset-password`

## Page States

### ResetPasswordPage States

1. **Verifying State** (initial)
   - Shows loading spinner
   - Calls verify endpoint with UUID from query params
   - Transitions to verified or error state

2. **Error State** (invalid/expired link)
   - Shows error icon and message
   - Provides link to request new reset link
   - Redirects to `/auth/forgot-password`

3. **Form State** (verified)
   - Displays email from verification response
   - Shows new password and confirm password fields
   - Validates:
     - Both fields are filled
     - Passwords match
     - Password is at least 6 characters
   - Submits to reset password endpoint

4. **Success State**
   - Shows success icon and message
   - Provides link to login page
   - Redirects to `/auth/login`

## Styling

All pages follow the existing design system:
- Uses CSS custom properties (var(--primary), var(--foreground), etc.)
- Consistent with Login/Register pages
- Animated background via `AnimatedBackgroundAuth`
- Responsive design with max-width containers
- Lucide icons for visual elements
- Sonner toast notifications for feedback

## Validation Rules

### Email Input (ForgotPasswordPage)
- Required field
- Must be valid email format
- Client-side validation before API call

### Password Input (ResetPasswordPage)
- Required field
- Minimum 6 characters
- Must match confirmation password
- Client-side validation before API call

## Error Handling

### ForgotPasswordPage
- Empty email field
- API errors (network, server errors)
- Toast notifications for all error states

### ResetPasswordPage
- Missing UUID parameter
- Invalid/expired UUID
- API errors during verification
- Password validation errors
- Password reset API errors
- Toast notifications for all error states

## Security Considerations

1. **No Authentication Required**: Both forgot password and reset password endpoints don't require authentication
2. **Time-limited Links**: Backend enforces 30-minute expiration on reset links
3. **One-time Use**: UUID can only be used once (enforced by backend)
4. **Secure Password Requirements**: Minimum 6 characters enforced
5. **Token in Query Params**: UUID passed via URL query parameters (standard practice for email links)

## Testing Checklist

- [ ] Navigate to `/auth/forgot-password`
- [ ] Enter email and submit
- [ ] Verify success message appears
- [ ] Check email for reset link
- [ ] Click reset link (should open `/auth/reset-password?uuid=xxx`)
- [ ] Verify loading state shows while verifying link
- [ ] Verify email is displayed in form
- [ ] Enter mismatched passwords - verify error
- [ ] Enter password < 6 characters - verify error
- [ ] Enter matching passwords >= 6 characters
- [ ] Submit form
- [ ] Verify success message
- [ ] Click "Sign in" link
- [ ] Verify redirect to login page
- [ ] Test with invalid/expired UUID
- [ ] Verify error state and "Request new link" button

## Notes

- The forgot password flow is split into 3 API calls as per backend specification
- Reset password page is accessible without authentication (required for email link access)
- UUID is passed via URL query parameters (standard for email-based flows)
- All API responses follow the standard `{ status, data, message }` format
- Toast notifications provide user feedback for all operations
- Loading states prevent duplicate submissions
- Form validation provides immediate feedback