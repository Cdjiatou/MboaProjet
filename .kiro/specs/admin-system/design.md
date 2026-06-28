# Design Document - Admin System

## Overview

The Admin System is a comprehensive management interface for the MBOA NEXT STAR voting/competition platform. It provides administrators and coaches with tools to manage candidates, monitor votes in real-time, process financial transactions, configure platform settings, and export data for analysis.

### System Architecture

The system follows a **layered architecture pattern** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer (React)                   │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Dashboard  │  │   Candidate  │  │    Financial     │   │
│  │  Component  │  │   Manager    │  │    Manager       │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          ↕ HTTP/JSON (RESTful API)
┌─────────────────────────────────────────────────────────────┐
│                    Backend Layer (Express)                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Middleware Layer                       │    │
│  │  • CORS  • JSON Parser  • Auth  • Validation       │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Route Layer                            │    │
│  │  /api/admin/*  /api/auth/*  /api/*                 │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Controller Layer                       │    │
│  │  • Request Validation  • Response Formatting        │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Service Layer (Business Logic)         │    │
│  │  • Admin Service  • Candidate Service               │    │
│  │  • Vote Service   • Export Service                  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          ↕ Prisma ORM
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer (PostgreSQL)                    │
│  Users  |  Candidates  |  Votes  |  Withdrawals  |  Config │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Service Layer Pattern**: Business logic is isolated in service modules (`admin.service.ts`, `candidate.service.ts`, etc.) to:
   - Enable unit testing without HTTP mocking
   - Support code reuse across multiple controllers
   - Maintain single responsibility principle

2. **JWT-Based Authentication**: Stateless authentication using JSON Web Tokens with role-based access control:
   - Admin users get tokens with `type: "admin"`
   - Candidate users get tokens with `type: "candidate"`
   - Middleware validates token and injects decoded payload into `req.user`

3. **Middleware Chaining**: Express middleware pipeline for cross-cutting concerns:
   - **CORS** → allows frontend on different domain
   - **JSON Parser** → parses request bodies
   - **Authentication** → validates JWT tokens
   - **Validation** → validates request schema (Zod)
   - **Error Handler** → catches and formats all errors

4. **Database as Configuration Store**: Dynamic site configuration stored in PostgreSQL rather than environment variables to allow runtime updates without redeployment

5. **File Upload Strategy**: Candidate photos stored in `backend/uploads/` directory with multer middleware handling multipart form data

---

## Architecture

### Technology Stack

**Backend:**
- **Runtime**: Node.js (v18+) with TypeScript for type safety
- **Framework**: Express.js for HTTP routing and middleware
- **ORM**: Prisma for type-safe database access
- **Database**: PostgreSQL for relational data storage
- **Authentication**: JWT (jsonwebtoken library) for stateless auth
- **Validation**: Zod for runtime type checking
- **File Uploads**: Multer for handling multipart/form-data

**Frontend:**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: TailwindCSS for utility-first CSS
- **State Management**: React Context API for global auth state
- **HTTP Client**: Fetch API with custom wrapper for API calls
- **Routing**: React Router v6 for client-side navigation

### System Components

#### Backend Components

1. **Authentication Service** (`auth.service.ts`)
   - Validates admin credentials against User table
   - Hashes passwords with bcrypt
   - Generates JWT tokens with role and expiration

2. **Admin Service** (`admin.service.ts`)
   - Aggregates dashboard statistics (votes, revenue, candidates)
   - Manages site configuration via upsert pattern
   - Calculates withdrawal fees (3% of requested amount)

3. **Candidate Service** (`candidate.service.ts`)
   - Creates candidate profiles with validation
   - Generates 6-digit OTP codes
   - Integrates with WhatsApp API for OTP delivery
   - Updates candidate status through verification workflow

4. **Vote Service** (`vote.service.ts`)
   - Tracks vote transactions with payment references
   - Updates candidate vote cache counters
   - Manages vote status transitions (PENDING → SUCCESS/FAILED)

5. **Export Service** (`export.service.ts`)
   - Generates CSV files with UTF-8 BOM for Excel compatibility
   - Uses semicolon separators (European CSV standard)
   - Masks voter identifiers for privacy
   - Formats dates in ISO 8601

6. **External Service** (`external.service.ts`)
   - Handles WhatsApp API integration for OTP delivery
   - Manages payment gateway webhooks
   - Logs external service failures

#### Frontend Components

1. **AdminLayout Component**
   - Sidebar navigation with active route highlighting
   - Top bar with search and notifications
   - Logout functionality with token cleanup
   - Responsive layout (desktop, tablet, mobile)

2. **Dashboard Component**
   - Statistics cards (candidates, votes, revenue, withdrawals)
   - Recent candidates table
   - Live vote activity feed
   - Category-wise vote breakdown

3. **CandidateManager Component**
   - Candidate creation form with validation
   - Photo upload with preview
   - Status management (PENDING_VERIFICATION → VERIFIED → ACTIVE)
   - Candidate listing with search and filters

4. **VoteMonitor Component**
   - Real-time vote feed (most recent first)
   - Masked voter identifiers (first3 + *** + last3)
   - Time elapsed display (e.g., "Il y a 2 min")
   - Vote status indicators (color-coded)

5. **FinancialManager Component**
   - Withdrawal initiation form
   - Fee calculation preview (3% deduction)
   - Withdrawal history table
   - Revenue statistics

6. **ConfigEditor Component**
   - Key-value pair editor
   - Batch update support
   - Transaction-based saves (all or nothing)

---

## Components and Interfaces

### API Endpoints

All admin endpoints are prefixed with `/api/admin` and require authentication.

#### Authentication Endpoints

```
POST /api/auth/login
Content-Type: application/json

Request Body:
{
  "email": "admin@mboa.com",
  "password": "securePassword123"
}

Response (200 OK):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Admin Name",
    "email": "admin@mboa.com",
    "role": "SUPER_ADMIN"
  }
}

Response (401 Unauthorized):
{
  "success": false,
  "message": "Email ou mot de passe incorrect."
}
```

#### Dashboard Endpoints

```
GET /api/admin/dashboard/stats
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "data": {
    "totalCandidates": 45,
    "totalVotes": 1250,
    "totalRevenue": 125000,
    "pendingWithdrawals": 3,
    "totalVotesGlobal": 1250,
    "votesByCategory": [
      {
        "category": "Chant",
        "totalVotes": 450
      },
      {
        "category": "Danse",
        "totalVotes": 380
      }
    ],
    "recentCandidates": [
      {
        "id": 23,
        "firstName": "Marie",
        "lastName": "Dubois",
        "totalVotesCache": 45,
        "status": "ACTIVE",
        "category": { "name": "Chant" }
      }
    ],
    "recentVotes": [
      {
        "id": 1234,
        "voterIdentifier": "237********789",
        "amount": 100,
        "createdAt": "2025-01-15T14:30:00Z",
        "candidate": {
          "firstName": "Marie",
          "lastName": "Dubois"
        }
      }
    ]
  }
}
```

#### Candidate Management Endpoints

```
POST /api/admin/candidates
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean.dupont@example.com",
  "phone": "+237691234567",
  "categoryId": 2,
  "city": "Yaoundé",
  "country": "Cameroun",
  "biography": "Passionate singer...",
  "videoUrl": "https://youtube.com/watch?v=...",
  "socialLinks": {
    "facebook": "https://facebook.com/...",
    "instagram": "@username"
  }
}

Response (201 Created):
{
  "success": true,
  "message": "Candidat créé et OTP envoyé via WhatsApp.",
  "candidate": {
    "id": 46,
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean.dupont@example.com",
    "phone": "+237691234567",
    "status": "PENDING_VERIFICATION",
    "verificationCode": "123456",
    "totalVotesCache": 0,
    "createdAt": "2025-01-15T15:00:00Z"
  }
}

Response (409 Conflict):
{
  "success": false,
  "message": "Un candidat avec cet email existe déjà."
}
```

#### Financial Management Endpoints

```
POST /api/admin/withdrawals
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "amount": 50000
}

Response (201 Created):
{
  "success": true,
  "message": "Retrait initié avec succès.",
  "withdrawal": {
    "id": 15,
    "requestedAmount": 50000,
    "feeAmount": 1500,
    "netAmount": 48500,
    "status": "PENDING",
    "createdAt": "2025-01-15T16:00:00Z"
  }
}

Response (400 Bad Request):
{
  "success": false,
  "message": "Le montant doit être supérieur à 0."
}
```

#### Configuration Endpoints

```
POST /api/admin/config
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "configs": [
    {
      "key": "votingStartDate",
      "value": "2025-02-01T00:00:00Z"
    },
    {
      "key": "votingEndDate",
      "value": "2025-03-01T23:59:59Z"
    },
    {
      "key": "votePrice",
      "value": "100"
    }
  ]
}

Response (200 OK):
{
  "success": true,
  "message": "Configuration mise à jour avec succès."
}
```

#### Export Endpoints

```
GET /api/admin/exports/votes
Authorization: Bearer <token>

Response (200 OK):
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="export_votes.csv"

ID Vote;Artiste;Identifiant Votant;Référence Mavians;Montant (FCFA);Date
1234;"Marie Dubois";237***789;VOTE_23_1705329000_abc123;100;2025-01-15T14:30:00Z
1235;"Jean Martin";651***432;VOTE_18_1705329060_xyz789;100;2025-01-15T14:31:00Z
```

```
GET /api/admin/exports/withdrawals
Authorization: Bearer <token>

Response (200 OK):
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="export_retraits.csv"

ID Retrait;Montant Brut (FCFA);Frais 3% (FCFA);Montant Net (FCFA);Statut;Date
15;50000;1500;48500;PENDING;2025-01-15T16:00:00Z
14;30000;900;29100;COMPLETED;2025-01-14T10:00:00Z
```

### Middleware Pipeline

The Express middleware pipeline processes requests in the following order:

1. **CORS Middleware** (`cors()`)
   - Allows cross-origin requests from frontend domain
   - Adds appropriate CORS headers to responses

2. **JSON Parser** (`express.json()`)
   - Parses JSON request bodies
   - Makes data available in `req.body`

3. **Route Handlers** (defined per endpoint)
   - Routes to appropriate controller functions

4. **Authentication Middleware** (`authenticateAdmin` / `authenticateCandidate`)
   - Extracts Bearer token from Authorization header
   - Verifies JWT signature and expiration
   - Checks user role matches endpoint requirements
   - Injects decoded payload into `req.user`

5. **Validation Middleware** (`validate(schema)`)
   - Validates request body/params/query against Zod schema
   - Returns 400 with validation errors if invalid
   - Provides type safety to controllers

6. **Controller Functions** (e.g., `createCandidate`, `getStats`)
   - Wrapped in `catchAsync` to handle async errors
   - Delegates to service layer
   - Formats success responses

7. **Error Handler** (`errorHandler`)
   - Catches all errors (AppError, Prisma errors, unexpected errors)
   - Formats consistent error responses
   - Logs errors in production
   - Returns appropriate HTTP status codes

### Service Layer Architecture

Services encapsulate business logic and database operations:

**Admin Service**:
```typescript
// Calculate dashboard statistics
getDashboardStats(): Promise<DashboardStats>

// Update site configuration (batch upsert)
updateSiteConfig(configs: {key: string, value: string}[]): Promise<void>

// Calculate withdrawal fees (pure function)
calculateWithdrawalFees(amount: number): {feeAmount: number, netAmount: number}

// Initiate withdrawal request
initiateWithdrawal(amount: number): Promise<Withdrawal>
```

**Candidate Service**:
```typescript
// Create candidate with OTP generation and WhatsApp delivery
createCandidateByCoach(data: CandidateInput): Promise<Candidate>

// Verify OTP code and activate candidate
verifyOTP(candidateId: number, code: string): Promise<Candidate>

// Update candidate profile
updateCandidateProfile(candidateId: number, data: Partial<CandidateInput>): Promise<Candidate>
```

**Vote Service**:
```typescript
// Initialize vote transaction with payment reference
initiateVote(candidateId: number, voterIdentifier: string): Promise<Vote>

// Update vote status after payment confirmation
confirmVote(paymentReference: string): Promise<Vote>

// Get vote statistics for candidate
getCandidateVoteStats(candidateId: number): Promise<VoteStats>
```

**Export Service**:
```typescript
// Generate CSV export of all successful votes
generateVotesCSV(): Promise<string>

// Generate CSV export of all withdrawals
generateWithdrawalsCSV(): Promise<string>

// Helper: Mask voter identifier for privacy
maskVoterIdentifier(identifier: string): string
```

---

## Data Models

The database schema is defined using Prisma ORM. Key models and their relationships:

### User Model
```prisma
model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  password  String   // bcrypt hashed
  role      Role     @default(COACH)
  createdAt DateTime @default(now())
}

enum Role {
  SUPER_ADMIN
  COACH
}
```

**Relationships**: None (authentication only)

### Category Model
```prisma
model Category {
  id         Int         @id @default(autoincrement())
  name       String
  slug       String      @unique
  candidates Candidate[]
}
```

**Relationships**: One-to-many with Candidate

### Candidate Model
```prisma
model Candidate {
  id                Int             @id @default(autoincrement())
  categoryId        Int
  category          Category        @relation(fields: [categoryId], references: [id])
  firstName         String
  lastName          String
  email             String          @unique
  phone             String          @unique
  birthDate         DateTime?
  city              String?
  country           String?
  biography         String?         @db.Text
  profilePhoto      String?         // File path in backend/uploads/
  videoUrl          String?
  socialLinks       Json?           // {facebook: "...", instagram: "..."}
  slug              String?         @unique
  verificationCode  String?         // 6-digit OTP
  status            CandidateStatus @default(PENDING_VERIFICATION)
  totalVotesCache   Int             @default(0) // Denormalized counter
  votes             Vote[]
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@index([slug])
  @@index([categoryId])
}

enum CandidateStatus {
  PENDING_VERIFICATION  // Awaiting OTP verification
  VERIFIED              // OTP verified, profile incomplete
  ACTIVE                // Fully active, visible to voters
}
```

**Relationships**: 
- Many-to-one with Category
- One-to-many with Vote

**Business Rules**:
- `email` and `phone` must be globally unique
- `verificationCode` generated on creation, cleared after verification
- `totalVotesCache` updated on successful vote for performance (denormalization)

### Vote Model
```prisma
model Vote {
  id               Int        @id @default(autoincrement())
  candidateId      Int
  candidate        Candidate  @relation(fields: [candidateId], references: [id])
  voterIdentifier  String     // Masked phone number
  paymentReference String     @unique // VOTE_{candidateId}_{timestamp}_{random}
  amount           Int        @default(100)
  status           VoteStatus @default(PENDING)
  paidAt           DateTime?
  createdAt        DateTime   @default(now())

  @@index([candidateId, voterIdentifier])
}

enum VoteStatus {
  PENDING   // Payment initiated but not confirmed
  SUCCESS   // Payment confirmed, vote counted
  FAILED    // Payment failed or cancelled
}
```

**Relationships**: Many-to-one with Candidate

**Business Rules**:
- One SUCCESS vote per candidate-voter pair (enforced in service layer)
- `paymentReference` format: `VOTE_{candidateId}_{unixTimestamp}_{randomString}`
- `paidAt` timestamp set when status transitions to SUCCESS

### SiteConfiguration Model
```prisma
model SiteConfiguration {
  id          Int      @id @default(autoincrement())
  configKey   String   @unique
  configValue String   @db.Text
  updatedAt   DateTime @updatedAt
}
```

**Relationships**: None (key-value store)

**Common Keys**:
- `votingStartDate`: ISO 8601 timestamp
- `votingEndDate`: ISO 8601 timestamp
- `votePrice`: Integer (FCFA)
- `maintenanceMode`: "true" or "false"
- `siteName`: String
- `contactEmail`: String

### Withdrawal Model
```prisma
model Withdrawal {
  id              Int              @id @default(autoincrement())
  requestedAmount Int              // Gross amount requested
  feeAmount       Int              // 3% fee (floor)
  netAmount       Int              // Net amount = requested - fee
  status          WithdrawalStatus @default(PENDING)
  createdAt       DateTime         @default(now())
}

enum WithdrawalStatus {
  PENDING     // Awaiting processing
  COMPLETED   // Funds transferred
}
```

**Relationships**: None

**Business Rules**:
- `feeAmount = floor(requestedAmount * 0.03)`
- `netAmount = requestedAmount - feeAmount`
- Status transitions: PENDING → COMPLETED (no reversals)

### Sponsor and SponsorMedia Models
```prisma
model Sponsor {
  id           Int          @id @default(autoincrement())
  name         String
  description  String?      @db.Text
  websiteUrl   String?
  logoUrl      String?
  tier         SponsorTier  @default(PARTNER)
  displayOrder Int          @default(0)
  isActive     Boolean      @default(true)
  media        SponsorMedia[]
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  @@index([displayOrder])
  @@index([isActive])
}

model SponsorMedia {
  id           Int       @id @default(autoincrement())
  sponsorId    Int
  sponsor      Sponsor   @relation(fields: [sponsorId], references: [id], onDelete: Cascade)
  mediaType    MediaType
  mediaUrl     String
  thumbnailUrl String?
  title        String?
  description  String?   @db.Text
  displayOrder Int       @default(0)
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([sponsorId])
  @@index([displayOrder])
}

enum SponsorTier {
  PLATINUM
  GOLD
  SILVER
  BRONZE
  PARTNER
}

enum MediaType {
  IMAGE
  VIDEO
}
```

**Relationships**: Sponsor has one-to-many with SponsorMedia

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Assessment of Property-Based Testing Applicability

The Admin System is primarily a **CRUD application** with database operations, dashboard visualization, and file exports. Most functionality is better tested with example-based unit tests and integration tests. However, there are **specific pure functions** that benefit from property-based testing:

1. **Financial calculations** (withdrawal fees)
2. **CSV serialization** (round-trip properties)
3. **Configuration parsing/formatting** (round-trip properties)
4. **Data masking** (voter identifier privacy)

For components like UI rendering, dashboard statistics aggregation, database CRUD operations, and external API integrations, we will rely on **example-based tests, integration tests, and snapshot tests** rather than property-based testing.



### Property 1: Withdrawal Fee Calculation Correctness

*For any* positive withdrawal amount, the fee calculation SHALL produce a fee amount equal to 3% of the requested amount rounded down to the nearest integer, and the net amount SHALL equal the requested amount minus the calculated fee.

**Validates: Requirements 5.2, 5.3**

**Property Specification**:
```
Given: amount > 0
When: calculateWithdrawalFees(amount) is called
Then: 
  - feeAmount === floor(amount * 0.03)
  - netAmount === amount - feeAmount
  - requestedAmount === feeAmount + netAmount (inverse relationship)
```

**Test Strategy**: Generate random positive integers (1 to 10,000,000 FCFA range) and verify the fee calculation formula holds for all cases. This tests edge cases like amounts that produce fractional fees (e.g., 1000 → 30, 1001 → 30, 1034 → 31).

---

### Property 2: CSV Export Format Correctness

*For any* CSV export generated by the Export_Engine, the output SHALL include a UTF-8 BOM prefix, use semicolon field separators, and properly quote fields containing special characters.

**Validates: Requirements 6.2, 6.3, 6.7**

**Property Specification**:
```
Given: any data set to export (votes or withdrawals)
When: generateVotesCSV() or generateWithdrawalsCSV() is called
Then:
  - output.startsWith('\uFEFF') === true (UTF-8 BOM)
  - all data rows use ';' as field separator
  - fields containing special chars (";", ",", newline, quotes) are wrapped in double quotes
  - nested quotes are properly escaped as ""
```

**Test Strategy**: Generate CSV exports with various data including special characters, verify BOM presence, separator consistency, and quoting rules. Test with candidate names containing commas, semicolons, quotes, and newlines.

---

### Property 3: Voter Identifier Masking Privacy

*For any* voter identifier string with length >= 6, the masking function SHALL preserve the first 3 and last 3 characters while replacing all middle characters with asterisks.

**Validates: Requirements 6.5**

**Property Specification**:
```
Given: identifier.length >= 6
When: maskVoterIdentifier(identifier) is called
Then:
  - result.startsWith(identifier.substring(0, 3)) === true
  - result.endsWith(identifier.substring(identifier.length - 3)) === true
  - middle section contains only '*' characters
  - result.length >= 7 (at least first3 + '*' + last3)

Edge case: identifier.length < 6
  - Implementation should return identifier unchanged or mask appropriately
```

**Test Strategy**: Generate random phone numbers and identifiers of varying lengths (6 to 20 characters) and verify masking preserves privacy while maintaining first/last 3 characters. Test edge cases with exactly 6 characters.

---

### Property 4: Configuration Serialization Round-Trip

*For any* valid Configuration object, serializing to string format and then parsing back SHALL produce an equivalent configuration object.

**Validates: Requirements 11.4**

**Property Specification**:
```
Given: valid Configuration object C = {key: k, value: v}
When: C2 = parse(print(C))
Then:
  - C2.key === C.key
  - C2.value === C.value
  - parse(print(parse(print(C)))) === parse(print(C)) (idempotence)
```

**Test Strategy**: Generate random configuration objects with various key-value pairs (including special characters, JSON strings, numbers as strings) and verify round-trip preserves data integrity. Test idempotence by performing multiple round-trips.

---

### Property 5: Email Format Validation

*For any* string submitted as an email address, the validation function SHALL accept all RFC 5322 compliant email formats and reject all malformed email strings.

**Validates: Requirements 12.8**

**Property Specification**:
```
Given: a string representing an email address
When: validateEmail(email) is called
Then:
  - For valid formats (user@domain.tld): returns true
  - For invalid formats (missing @, invalid domain, etc.): returns false
  - Validation is consistent (same input → same output)

Valid patterns include:
  - simple@example.com
  - name.surname@company.co.uk
  - user+tag@subdomain.example.org
  
Invalid patterns include:
  - missing-at-sign.com
  - @no-local-part.com
  - no-domain@
  - spaces in@email.com
```

**Test Strategy**: Use a property-based testing library to generate both valid email addresses (following RFC 5322 rules) and invalid variations. Verify the validator correctly classifies each. Focus on edge cases like plus addressing, subdomains, and special characters.

---

### Property 6: Phone Number Format Validation

*For any* string submitted as a phone number, the validation function SHALL accept valid international formats (E.164 or regional) and reject malformed phone strings.

**Validates: Requirements 12.9**

**Property Specification**:
```
Given: a string representing a phone number
When: validatePhone(phone) is called
Then:
  - For valid formats: returns true
  - For invalid formats: returns false
  - Minimum length check (>= 8 digits)
  
Valid patterns include:
  - +237691234567 (E.164 international)
  - 237691234567 (without plus)
  - 691234567 (local format if configured)
  
Invalid patterns include:
  - too-short (< 8 digits)
  - letters-mixed-in
  - only special characters
```

**Test Strategy**: Generate random phone numbers in various formats (international, local, with/without country codes) and verify validation. Test boundary cases with minimum/maximum lengths. Focus on Cameroon phone format (+237) as primary use case.

---

## Error Handling

### Error Handling Strategy

The Admin System implements a **centralized error handling** approach using Express error middleware and a custom `AppError` class for consistent error responses across the API.

### Error Classification

**1. Client Errors (4xx status codes)**

- **400 Bad Request**: Invalid request data (validation failures)
  - Missing required fields
  - Invalid data types
  - Out-of-range values
  - Malformed JSON

- **401 Unauthorized**: Authentication failures
  - Missing Authorization header
  - Invalid or expired JWT token
  - Token signature verification failed

- **403 Forbidden**: Authorization failures
  - Valid token but insufficient privileges
  - COACH attempting SUPER_ADMIN operations

- **404 Not Found**: Resource not found
  - Candidate ID does not exist
  - Configuration key not found
  - Invalid route

- **409 Conflict**: Database constraint violations
  - Duplicate email address (unique constraint)
  - Duplicate phone number (unique constraint)
  - Concurrent modification conflicts

**2. Server Errors (5xx status codes)**

- **500 Internal Server Error**: Unexpected errors
  - Unhandled exceptions
  - Database connection failures
  - File system errors

- **502 Bad Gateway**: External service failures
  - WhatsApp API unavailable
  - Payment gateway timeout

### AppError Class

Custom error class for creating structured HTTP errors:

```typescript
class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguishes from programming errors
    
    Error.captureStackTrace(this, this.constructor);
  }
}
```

**Usage in services**:
```typescript
// Example: Validation error
if (amount <= 0) {
  throw new AppError('Le montant doit être supérieur à 0.', 400);
}

// Example: Not found error
if (!candidate) {
  throw new AppError('Candidat introuvable.', 404);
}

// Example: Conflict error
if (existingUser) {
  throw new AppError('Un utilisateur avec cet email existe déjà.', 409);
}
```

### Error Handler Middleware

Centralized error handling middleware catches all errors and formats responses:

```typescript
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default to 500 for unexpected errors
  let statusCode = 500;
  let message = 'Une erreur interne est survenue.';

  // Handle operational errors (AppError instances)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  
  // Handle Prisma errors
  else if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    
    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      statusCode = 409;
      message = `Un enregistrement avec cette valeur existe déjà.`;
    }
    
    // Foreign key constraint violation
    else if (prismaError.code === 'P2003') {
      statusCode = 400;
      message = 'Référence invalide à une ressource inexistante.';
    }
    
    // Record not found
    else if (prismaError.code === 'P2025') {
      statusCode = 404;
      message = 'Ressource introuvable.';
    }
  }
  
  // Handle validation errors (Zod)
  else if (err.name === 'ZodError') {
    statusCode = 400;
    const zodError = err as any;
    message = zodError.errors.map((e: any) => e.message).join(', ');
  }

  // Log errors in production (but don't expose details)
  if (process.env.NODE_ENV === 'production') {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method
    });
    
    // Hide internal error details from client
    if (statusCode === 500) {
      message = 'Une erreur interne est survenue.';
    }
  }
  
  // Send error response
  res.status(statusCode).json({
    success: false,
    message
  });
};
```

### Validation Error Responses

Zod validation middleware returns structured error messages:

```json
{
  "success": false,
  "message": "Email invalide, Le montant doit être positif"
}
```


### Async Error Handling

The `catchAsync` wrapper eliminates try-catch boilerplate in controllers:

```typescript
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

**Usage**:
```typescript
export const createCandidate = catchAsync(async (req: Request, res: Response) => {
  const candidate = await createCandidateByCoach(req.body);
  res.status(201).json({ success: true, candidate });
  // No try-catch needed - errors automatically forwarded to error handler
});
```

### Frontend Error Handling

The frontend implements a consistent error handling pattern:

```typescript
async function handleAPICall<T>(apiFunction: Promise<T>): Promise<T> {
  try {
    return await apiFunction;
  } catch (error) {
    // Parse error response
    const errorMessage = error.response?.data?.message || 
                        'Une erreur est survenue';
    
    // Display user-friendly error notification
    showErrorToast(errorMessage);
    
    // Rethrow for component-level handling if needed
    throw error;
  }
}
```

---

## Testing Strategy

The Admin System employs a **dual testing approach** combining example-based unit tests with property-based tests for pure functions.

### Testing Pyramid

```
        ┌─────────────────┐
        │   E2E Tests     │  ← Few (critical user flows)
        │   (Playwright)  │
        └─────────────────┘
      ┌───────────────────────┐
      │  Integration Tests    │  ← Some (API + DB)
      │  (Jest + Supertest)   │
      └───────────────────────┘
    ┌─────────────────────────────┐
    │     Unit Tests              │  ← Many (services, utils)
    │  (Jest + fast-check for PBT)│
    └─────────────────────────────┘
```

### Unit Testing Strategy

**Example-Based Unit Tests** for:
- CRUD operations (create candidate, update config)
- Database queries (getDashboardStats)
- API controllers (request/response handling)
- Middleware (authentication, validation)
- Integration with external services (WhatsApp API mocks)

**Test Framework**: Jest with TypeScript support

**Example**:
```typescript
describe('Admin Service - Dashboard Stats', () => {
  it('should calculate total votes correctly', async () => {
    // Arrange: seed database with test data
    await seedTestVotes(5);
    
    // Act: call service function
    const stats = await getDashboardStats();
    
    // Assert: verify expected output
    expect(stats.totalVotes).toBe(5);
  });

  it('should aggregate votes by category', async () => {
    await seedTestData();
    const stats = await getDashboardStats();
    
    expect(stats.votesByCategory).toContainEqual({
      category: 'Chant',
      totalVotes: 3
    });
  });
});
```


### Property-Based Testing Strategy

**Property-Based Tests** for:
- **Pure mathematical functions** (withdrawal fee calculation)
- **Data transformation functions** (voter identifier masking)
- **Serialization/deserialization** (configuration round-trip, CSV formatting)
- **Input validation** (email and phone validation)

**Test Library**: `fast-check` (TypeScript-native PBT library)

**Configuration**: Minimum 100 iterations per property test

**Example**:
```typescript
import fc from 'fast-check';

describe('Property: Withdrawal Fee Calculation', () => {
  it('should calculate fees correctly for any positive amount', () => {
    // Feature: admin-system, Property 1: Withdrawal fee calculation
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10_000_000 }), // Generate random amounts
        (amount) => {
          // Act
          const { feeAmount, netAmount } = calculateWithdrawalFees(amount);
          
          // Assert properties
          expect(feeAmount).toBe(Math.floor(amount * 0.03));
          expect(netAmount).toBe(amount - feeAmount);
          expect(feeAmount + netAmount).toBe(amount); // Inverse
        }
      ),
      { numRuns: 100 } // Run 100 random test cases
    );
  });
});
```

```typescript
describe('Property: Voter Identifier Masking', () => {
  it('should preserve first 3 and last 3 characters', () => {
    // Feature: admin-system, Property 3: Voter identifier masking
    fc.assert(
      fc.property(
        fc.string({ minLength: 6, maxLength: 20 }), // Generate identifiers
        (identifier) => {
          // Act
          const masked = maskVoterIdentifier(identifier);
          
          // Assert properties
          expect(masked.substring(0, 3)).toBe(identifier.substring(0, 3));
          expect(masked.substring(masked.length - 3)).toBe(
            identifier.substring(identifier.length - 3)
          );
          expect(masked).toContain('***');
        }
      ),
      { numRuns: 100 }
    );
  });
});
```


```typescript
describe('Property: Configuration Round-Trip', () => {
  it('should preserve data through serialize/deserialize', () => {
    // Feature: admin-system, Property 4: Configuration round-trip
    fc.assert(
      fc.property(
        fc.record({
          key: fc.string({ minLength: 1, maxLength: 50 }),
          value: fc.string({ minLength: 0, maxLength: 1000 })
        }),
        (config) => {
          // Act: serialize then deserialize
          const serialized = printConfig(config);
          const deserialized = parseConfig(serialized);
          
          // Assert: round-trip equality
          expect(deserialized.key).toBe(config.key);
          expect(deserialized.value).toBe(config.value);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing Strategy

Integration tests verify the interaction between layers (API → Service → Database).

**Test Framework**: Jest + Supertest (HTTP assertions) + Test database

**Setup**:
- Use a separate test database (PostgreSQL)
- Reset database state before each test suite
- Seed minimal test data

**Example**:
```typescript
describe('POST /api/admin/candidates', () => {
  beforeEach(async () => {
    await resetTestDatabase();
    await seedCategories();
  });

  it('should create candidate and return 201', async () => {
    const response = await request(app)
      .post('/api/admin/candidates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean@example.com',
        phone: '+237691234567',
        categoryId: 1
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.candidate.status).toBe('PENDING_VERIFICATION');
  });

  it('should reject duplicate email with 409', async () => {
    await createTestCandidate({ email: 'existing@example.com' });

    await request(app)
      .post('/api/admin/candidates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Marie',
        lastName: 'Martin',
        email: 'existing@example.com',
        phone: '+237699999999',
        categoryId: 1
      })
      .expect(409);
  });
});
```


### Frontend Testing Strategy

**Component Tests** (React Testing Library):
- User interactions (form submissions, button clicks)
- Conditional rendering based on state
- API integration with mock responses

**Example**:
```typescript
describe('Dashboard Component', () => {
  it('should display loading state while fetching stats', () => {
    render(<Dashboard />);
    expect(screen.getByText(/chargement/i)).toBeInTheDocument();
  });

  it('should display statistics after successful fetch', async () => {
    mockAPI.getDashboardStats.mockResolvedValue({
      totalCandidates: 45,
      totalVotes: 1250,
      totalRevenue: 125000,
      pendingWithdrawals: 3
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('1250')).toBeInTheDocument();
    });
  });
});
```

### End-to-End Testing Strategy

**Framework**: Playwright (cross-browser testing)

**Critical User Flows**:
1. Admin login → Dashboard view
2. Create candidate → Verify OTP sent
3. View votes → Export CSV
4. Initiate withdrawal → Verify fee calculation

**Example**:
```typescript
test('Admin can create candidate and send OTP', async ({ page }) => {
  // Login
  await page.goto('/admin/login');
  await page.fill('[name="email"]', 'admin@mboa.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Navigate to candidates
  await page.click('text=Candidats');

  // Fill form
  await page.fill('[name="firstName"]', 'Test');
  await page.fill('[name="lastName"]', 'Candidate');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="phone"]', '+237691234567');
  await page.selectOption('[name="categoryId"]', '1');

  // Submit
  await page.click('button:has-text("Créer")');

  // Verify success
  await expect(page.locator('text=OTP envoyé')).toBeVisible();
});
```


### Test Coverage Goals

- **Unit tests**: 80%+ coverage of service and utility functions
- **Integration tests**: All API endpoints covered
- **Property tests**: All pure functions with mathematical or transformation logic
- **E2E tests**: Critical user flows (login, candidate creation, exports)

---

## Security Considerations

### Authentication Security

**1. Password Security**
- Passwords hashed using bcrypt with salt rounds = 10
- Never store plaintext passwords
- Password requirements enforced (minimum 8 characters, complexity rules)

```typescript
import bcrypt from 'bcrypt';

// Hashing on user creation
const hashedPassword = await bcrypt.hash(plainPassword, 10);

// Verification on login
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

**2. JWT Token Security**
- Tokens signed with strong secret key (min 256 bits)
- Short expiration time (24 hours) to limit token exposure
- Token includes minimal payload (id, role, type)
- No sensitive data in token (password, personal info)

```typescript
// Token generation
const token = jwt.sign(
  { id: user.id, role: user.role, type: 'admin' },
  process.env.JWT_SECRET!,
  { expiresIn: '24h' }
);
```

**3. Token Transmission**
- Always use HTTPS in production
- Tokens sent via Authorization header (Bearer scheme)
- Never expose tokens in URL query parameters
- Frontend stores tokens in memory or httpOnly cookies (not localStorage for XSS protection)


### Authorization Security

**Role-Based Access Control (RBAC)**:
- Two roles: SUPER_ADMIN and COACH
- Middleware validates role before allowing access
- SUPER_ADMIN: full access to all operations
- COACH: limited access (can create candidates, view dashboard, no financial operations)

```typescript
// Middleware checks role from JWT
if (req.user.role !== 'SUPER_ADMIN') {
  throw new AppError('Accès interdit.', 403);
}
```

### Input Validation Security

**1. Schema Validation**
- All inputs validated with Zod before processing
- Type safety enforced at runtime
- Prevents injection attacks via malformed data

**2. SQL Injection Prevention**
- Prisma ORM provides automatic parameterization
- Never concatenate user input into raw SQL queries
- All queries use Prisma's type-safe query builder

**3. NoSQL Injection Prevention**
- JSON fields validated before storage
- Schema validation on socialLinks object

**4. XSS Prevention**
- React automatically escapes output (prevents XSS)
- CSV exports quote special characters
- No direct HTML rendering of user input

### File Upload Security

**1. File Type Validation**
- Only allow image uploads for candidate photos (JPEG, PNG, GIF)
- Validate MIME type using multer and file-type library
- Reject executable files (.exe, .sh, .bat)

```typescript
const upload = multer({
  dest: 'backend/uploads/',
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});
```

**2. File Storage**
- Store uploads outside public web directory
- Generate unique filenames (UUID) to prevent overwrites
- Serve files through controlled endpoint (authentication required)


### Privacy and Data Protection

**1. Voter Identifier Masking**
- Mask phone numbers in admin dashboard and exports
- Show only first 3 and last 3 characters (e.g., "237***789")
- Prevents unauthorized identification of voters

**2. Personal Data Access Control**
- Only authenticated admins can view candidate emails/phones
- Logs maintained for data access auditing
- GDPR compliance: candidates can request data deletion

**3. Secure Data Transmission**
- HTTPS mandatory for all API requests in production
- TLS 1.2+ for encrypted communication
- CORS configured to allow only trusted frontend domains

### Rate Limiting and DDoS Protection

**1. API Rate Limiting**
- Implement express-rate-limit middleware
- Limit login attempts (5 per 15 minutes per IP)
- Limit candidate creation (10 per hour per admin)
- Limit export downloads (3 per hour per admin)

```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Trop de tentatives. Réessayez dans 15 minutes.'
});

app.use('/api/auth/login', loginLimiter);
```

**2. Request Size Limits**
- JSON body limited to 10MB
- File uploads limited to 5MB
- Prevent memory exhaustion attacks

### Logging and Monitoring

**1. Security Event Logging**
- Log all authentication attempts (success and failure)
- Log all admin actions (candidate creation, config changes, withdrawals)
- Log suspicious activity (multiple failed logins, unusual API patterns)

**2. Error Logging**
- Log all 5xx errors with stack traces
- Log external service failures (WhatsApp, payment gateway)
- Never log sensitive data (passwords, tokens, full phone numbers)

```typescript
console.error('Security Event:', {
  type: 'failed_login',
  email: email,
  ip: req.ip,
  timestamp: new Date().toISOString()
});
```

**3. Monitoring Alerts**
- Alert on repeated failed login attempts
- Alert on database connection failures
- Alert on external service downtime


### Environment Variables Security

**1. Secret Management**
- Never commit .env file to version control
- Use environment-specific .env files (.env.production, .env.development)
- Rotate JWT_SECRET periodically (every 90 days)

**2. Required Environment Variables**
```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mboa_db

# Authentication
JWT_SECRET=<strong-random-256-bit-key>
JWT_EXPIRES_IN=24h

# External Services
WHATSAPP_API_URL=https://api.whatsapp.com
WHATSAPP_API_KEY=<secret-key>
PAYMENT_GATEWAY_URL=https://payment.example.com
PAYMENT_API_KEY=<secret-key>

# Server
PORT=3000
NODE_ENV=production
```

**3. Validation on Startup**
```typescript
// config/env.ts
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'WHATSAPP_API_URL',
  'WHATSAPP_API_KEY'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});
```

---

## File Storage Strategy

### Upload Directory Structure

```
backend/
└── uploads/
    ├── candidates/
    │   ├── profiles/
    │   │   ├── {uuid}-{timestamp}.jpg
    │   │   ├── {uuid}-{timestamp}.png
    │   │   └── ...
    │   └── documents/
    │       └── ...
    └── temp/
        └── ... (cleaned up after 24h)
```


### File Upload Flow

1. **Client Uploads File**
   - Form submitted with `multipart/form-data`
   - Multer middleware intercepts upload

2. **Server Validation**
   - Check file type (MIME validation)
   - Check file size (max 5MB)
   - Generate unique filename (UUID + timestamp)

3. **File Storage**
   - Save to `backend/uploads/candidates/profiles/`
   - Store file path in database (`profilePhoto` field)

4. **File Serving**
   - Endpoint: `GET /api/files/candidate-photos/:filename`
   - Authentication required for private files
   - Set appropriate Content-Type header
   - Cache-Control headers for performance

```typescript
// File upload endpoint
router.post(
  '/candidates/:id/photo',
  authenticateAdmin,
  upload.single('photo'),
  async (req, res) => {
    const candidateId = parseInt(req.params.id);
    const filePath = req.file?.path;

    await prisma.candidate.update({
      where: { id: candidateId },
      data: { profilePhoto: filePath }
    });

    res.json({ success: true, filePath });
  }
);

// File serving endpoint
router.get('/files/candidate-photos/:filename', async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads/candidates/profiles', filename);

  // Security: validate file exists and is in allowed directory
  if (!fs.existsSync(filePath) || !filePath.includes('uploads/candidates')) {
    return res.status(404).send('File not found');
  }

  res.sendFile(filePath);
});
```

### File Cleanup Strategy

- **Temporary files**: Delete after 24 hours
- **Orphaned files**: Identify and delete files not referenced in database
- **Candidate deletion**: Cascade delete associated files

```typescript
// Cleanup job (run daily via cron)
async function cleanupOrphanedFiles() {
  const filesInDirectory = fs.readdirSync('backend/uploads/candidates/profiles');
  const filesInDatabase = await prisma.candidate.findMany({
    select: { profilePhoto: true }
  });

  const dbFilenames = filesInDatabase
    .map(c => c.profilePhoto)
    .filter(Boolean);

  filesInDirectory.forEach(file => {
    const filePath = path.join('backend/uploads/candidates/profiles', file);
    if (!dbFilenames.includes(filePath)) {
      fs.unlinkSync(filePath); // Delete orphaned file
    }
  });
}
```

---

## Frontend Component Architecture

### Component Hierarchy

```
App
├── AuthProvider (Context)
│   └── Router
│       ├── PublicRoute (/)
│       │   ├── HomePage
│       │   ├── CandidatesPage
│       │   └── VotingPage
│       │
│       ├── AdminLoginPage (/admin/login)
│       │
│       └── ProtectedRoute (/admin/*)
│           └── AdminLayout
│               ├── Sidebar
│               │   ├── Logo
│               │   ├── NavMenu
│               │   └── LogoutButton
│               │
│               ├── TopBar
│               │   ├── SearchInput
│               │   └── NotificationIcon
│               │
│               └── MainContent
│                   ├── Dashboard (/admin/dashboard)
│                   │   ├── StatsCards
│                   │   ├── RecentCandidatesTable
│                   │   └── VoteActivityFeed
│                   │
│                   ├── CandidatesPage (/admin/candidates)
│                   │   ├── CandidateForm
│                   │   ├── CandidateTable
│                   │   └── CandidateDetails
│                   │
│                   ├── VotesPage (/admin/votes)
│                   │   ├── VoteFilters
│                   │   └── VoteTable
│                   │
│                   ├── FinancesPage (/admin/finances)
│                   │   ├── RevenueStats
│                   │   ├── WithdrawalForm
│                   │   └── WithdrawalHistory
│                   │
│                   └── SettingsPage (/admin/settings)
│                       ├── ConfigEditor
│                       └── ExportButtons
```

### Key Components Specification

#### AdminLayout Component

**Purpose**: Provides consistent layout structure for all admin pages

**Props**: None (children rendered in main content area)

**State**:
- `isSidebarOpen: boolean` (mobile responsive)

**Features**:
- Sidebar with navigation links
- Active route highlighting
- Logout functionality
- Responsive design (collapsible sidebar on mobile)


#### Dashboard Component

**Purpose**: Display overview statistics and recent activity

**State**:
- `stats: DashboardStats | null`
- `loading: boolean`
- `error: string | null`

**Effects**:
- Fetch dashboard stats on mount
- Refresh every 60 seconds (optional real-time updates)

**Features**:
- 4 stats cards (candidates, votes, revenue, withdrawals)
- Recent candidates table (last 5)
- Vote activity feed (last 4 votes)
- Category-wise vote breakdown chart

**API Integration**:
```typescript
useEffect(() => {
  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/dashboard/stats');
      setStats(response.data.data);
    } catch (error) {
      setError('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  fetchStats();
  const interval = setInterval(fetchStats, 60000); // Refresh every 60s
  return () => clearInterval(interval);
}, []);
```

#### CandidateForm Component

**Purpose**: Create new candidate profiles

**Props**:
- `onSuccess: () => void` (callback after successful creation)

**State**:
- `formData: CandidateInput`
- `errors: Record<string, string>`
- `submitting: boolean`
- `photoPreview: string | null`

**Validation**:
- Client-side validation before submission
- Real-time error display
- Required fields: firstName, lastName, email, phone, categoryId

**Features**:
- Form fields with labels and placeholders
- Photo upload with preview
- Category dropdown
- Submit button with loading state
- Error display below each field


#### VoteActivityFeed Component

**Purpose**: Display real-time vote transactions

**Props**:
- `maxItems: number` (default 4)

**State**:
- `votes: Vote[]`
- `loading: boolean`

**Features**:
- Masked voter identifiers
- Time elapsed display ("Il y a 2 min")
- Vote amount with + prefix
- Candidate name
- Color-coded amounts (green for success)
- Animated new vote entry (optional)

**Time Formatting**:
```typescript
function formatTimeElapsed(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Il y a quelques secondes";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  return `Il y a ${diffDays} j`;
}
```

#### FinancialManager Component

**Purpose**: Manage withdrawals and view financial statistics

**State**:
- `withdrawalAmount: number`
- `feeAmount: number`
- `netAmount: number`
- `withdrawals: Withdrawal[]`
- `loading: boolean`

**Features**:
- Amount input with validation
- Real-time fee calculation preview (3%)
- Submit withdrawal button
- Withdrawal history table
- Status indicators (PENDING, COMPLETED)

**Fee Calculation Preview**:
```typescript
useEffect(() => {
  if (withdrawalAmount > 0) {
    const fee = Math.floor(withdrawalAmount * 0.03);
    const net = withdrawalAmount - fee;
    setFeeAmount(fee);
    setNetAmount(net);
  }
}, [withdrawalAmount]);
```


### State Management Strategy

**Authentication State**: Managed via React Context API

```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('adminToken')
  );
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    
    setToken(token);
    setUser(user);
    localStorage.setItem('adminToken', token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('adminToken');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**Component-Level State**: Use `useState` for local component state (form inputs, UI toggles)

**Server State**: Use custom hooks for API data fetching

```typescript
function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/dashboard/stats');
        setStats(response.data.data);
      } catch (err) {
        setError('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error, refetch: fetchStats };
}
```

