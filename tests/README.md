# Playwright Test Suite

This directory contains the comprehensive Playwright test suite for the Elimika application.

## Test Structure

```
tests/
├── auth/                     # Authentication flow tests
├── dashboard/                # Dashboard functionality tests
├── onboarding/              # User onboarding tests
├── business-logic/          # Core business logic tests
├── ui/                      # UI/UX specific tests
└── utils/                   # Test utilities and helpers
```

## Test Categories

### Authentication Tests
- Login/logout flows
- Session management
- Password reset
- Account verification

### Onboarding Tests
- Account type selection
- User registration forms
- Profile completion
- Navigation flows

### Dashboard Tests
- Student dashboard functionality
- Instructor dashboard functionality
- Organization dashboard functionality
- Navigation and routing

### Business Logic Tests
- Course enrollment process
- Payment processing
- Course management
- User profile management
- Data validation

### UI Tests
- Responsive design
- Form validation
- Accessibility
- Cross-browser compatibility

## Running Tests

### Basic Commands
```bash
# Run all tests
pnpm test

# Run tests in UI mode
pnpm test:ui

# Run tests in headed mode (see browser)
pnpm test:headed

# Run specific test file
pnpm test tests/auth/login.spec.ts

# Run tests for specific project (browser)
pnpm test --project=chromium

# Debug tests
pnpm test:debug
```

### Test Filtering
```bash
# Run tests by tag
pnpm test --grep "@smoke"

# Run tests in specific directory
pnpm test tests/business-logic/

# Skip specific tests
pnpm test --grep-invert "@slow"
```

## Test Data and Mocking

### Mock Data
All test data is centralized in `utils/mock-data.ts`:
- User profiles (student, instructor, organization)
- Course data
- API responses
- Sample form data

### API Mocking
Tests use Playwright's built-in request mocking:
```typescript
await helpers.mockApiResponse('**/api/courses', mockApiResponses.courses);
```

## Test Helpers

The `TestHelpers` class provides common functionality:
- Page navigation
- Form interactions
- API mocking
- Waiting utilities
- Screenshot capture

## Writing New Tests

### Test Naming Convention
```typescript
test.describe('Feature Name', () => {
  test('should perform specific action when condition is met', async ({ page }) => {
    // Test implementation
  });
});
```

### Using Test Helpers
```typescript
import { TestHelpers } from '../utils/test-helpers';

test('example test', async ({ page }) => {
  const helpers = new TestHelpers(page);
  
  await helpers.navigateToPage('/dashboard');
  await helpers.expectToBeVisible('[data-testid="welcome-message"]');
});
```

### Data Test IDs
Use `data-testid` attributes for reliable element selection:
```html
<button data-testid="submit-button">Submit</button>
```

## Test Environment

Tests are configured to run against:
- **Base URL**: http://localhost:3000
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: Pixel 5, iPhone 12
- **Auto-retry**: 2 retries in CI

## Continuous Integration

Tests automatically run in CI/CD pipeline:
- On pull requests
- On main branch pushes
- Nightly regression tests

## Best Practices

1. **Independent Tests**: Each test should be self-contained
2. **Data Cleanup**: Use beforeEach/afterEach for setup/teardown
3. **Stable Selectors**: Prefer data-testid over CSS selectors
4. **Mock External APIs**: Don't rely on external services
5. **Accessibility**: Include accessibility checks in UI tests
6. **Performance**: Use page.waitForLoadState() appropriately

## Debugging Tests

### Local Debugging
```bash
# Run single test in debug mode
pnpm test:debug tests/auth/login.spec.ts

# Run with browser visible
pnpm test:headed

# Generate trace files
pnpm test --trace on
```

### Test Reports
```bash
# View HTML report
pnpm test:report

# Generate and view report after test run
pnpm test --reporter=html
```

## Configuration

Test configuration is in `playwright.config.ts`:
- Timeout settings
- Retry policies
- Browser configurations
- Test patterns
- Reporting options