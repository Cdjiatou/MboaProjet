# Requirements Document - Admin System

## Introduction

Le système d'administration (Admin System) est une interface de gestion complète pour la plateforme de vote/concours MBOA NEXT STAR. Ce système permet aux administrateurs et coaches de gérer les candidats, surveiller les votes, traiter les retraits financiers, configurer la plateforme et exporter les données pour l'analyse. Le système repose sur une architecture backend Node.js/TypeScript avec Prisma (PostgreSQL) et un frontend React/TypeScript avec Vite.

## Glossary

- **Admin_System**: Ensemble des fonctionnalités backend et frontend permettant la gestion administrative de la plateforme
- **Admin_User**: Utilisateur ayant le rôle SUPER_ADMIN ou COACH dans le système
- **Dashboard_Service**: Service backend responsable de l'agrégation et du calcul des statistiques
- **Candidate_Manager**: Composant de gestion des candidats (création, modification, validation)
- **Vote_Monitor**: Composant de suivi en temps réel des votes et paiements
- **Financial_Manager**: Composant de gestion des transactions financières et retraits
- **Export_Engine**: Moteur de génération de fichiers CSV pour l'export de données
- **Config_Store**: Stockage de configuration dynamique en base de données
- **Auth_Token**: JWT (JSON Web Token) contenant l'identité et le rôle de l'utilisateur
- **Dashboard_Stats**: Ensemble de métriques agrégées (total votes, candidats, revenus, retraits)
- **Withdrawal_Request**: Demande de retrait de fonds avec calcul automatique des frais
- **CSV_Export**: Fichier de données au format CSV avec encodage UTF-8 et BOM
- **Payment_Reference**: Identifiant unique de transaction de type VOTE_{candidateId}_{timestamp}_{random}
- **OTP_Code**: Code de vérification à usage unique envoyé par WhatsApp
- **Candidate_Status**: État d'un candidat (PENDING_VERIFICATION, VERIFIED, ACTIVE)
- **Vote_Status**: État d'un vote (PENDING, SUCCESS, FAILED)
- **Withdrawal_Status**: État d'un retrait (PENDING, COMPLETED)

## Requirements

### Requirement 1: Authentication and Access Control

**User Story:** As an administrator, I want to securely authenticate and access the admin system, so that only authorized personnel can manage the platform.

#### Acceptance Criteria

1. WHEN an Admin_User submits valid credentials (email and password), THE Auth_System SHALL generate an Auth_Token containing user ID, role, and type
2. WHEN an Admin_User submits invalid credentials, THE Auth_System SHALL reject the authentication with a 401 status code
3. THE Auth_System SHALL hash passwords using bcrypt before comparison
4. THE Auth_Token SHALL include the user role (SUPER_ADMIN or COACH) for authorization purposes
5. WHEN an Admin_User attempts to access a protected endpoint without a valid Auth_Token, THE Admin_System SHALL reject the request with a 401 status code
6. THE Auth_Token SHALL remain valid for the duration specified in the JWT configuration
7. WHEN an Admin_User logs out, THE Frontend SHALL discard the Auth_Token from local storage

### Requirement 2: Dashboard Statistics and Monitoring

**User Story:** As an administrator, I want to view real-time statistics and key metrics, so that I can monitor the platform's performance and activity.

#### Acceptance Criteria

1. WHEN an Admin_User requests dashboard statistics, THE Dashboard_Service SHALL calculate the total number of SUCCESS votes across all candidates
2. WHEN an Admin_User requests dashboard statistics, THE Dashboard_Service SHALL aggregate votes by category
3. WHEN an Admin_User requests dashboard statistics, THE Dashboard_Service SHALL return a list of all candidates sorted by totalVotesCache in descending order
4. THE Dashboard_Service SHALL include candidate first name, last name, and category name in the statistics
5. THE Dashboard_Service SHALL compute total revenue by summing all SUCCESS vote amounts
6. THE Dashboard_Service SHALL count pending withdrawals with status PENDING
7. THE Dashboard_Stats SHALL include totalCandidates, totalVotes, totalRevenue, and pendingWithdrawals fields
8. WHEN dashboard data is requested, THE Dashboard_Service SHALL retrieve fresh data from the database without caching

### Requirement 3: Candidate Management

**User Story:** As a coach or administrator, I want to create and manage candidate profiles, so that artists can participate in the competition.

#### Acceptance Criteria

1. WHEN an Admin_User creates a new candidate, THE Candidate_Manager SHALL validate that firstName, lastName, email, phone, and categoryId are provided
2. WHEN an Admin_User creates a new candidate, THE Candidate_Manager SHALL verify that the email is unique in the database
3. WHEN an Admin_User creates a new candidate, THE Candidate_Manager SHALL verify that the phone number is unique in the database
4. WHEN a candidate is created successfully, THE Candidate_Manager SHALL generate a unique OTP_Code for verification
5. WHEN a candidate is created successfully, THE Candidate_Manager SHALL send the OTP_Code via WhatsApp to the candidate's phone number
6. THE Candidate_Manager SHALL initialize a new candidate with status PENDING_VERIFICATION
7. THE Candidate_Manager SHALL initialize totalVotesCache to zero for new candidates
8. WHEN an Admin_User requests candidate data, THE Admin_System SHALL return candidates with their associated category information
9. WHEN a candidate verification code is validated, THE Candidate_Manager SHALL update the status to VERIFIED
10. WHEN a candidate profile is complete and approved, THE Candidate_Manager SHALL update the status to ACTIVE

### Requirement 4: Vote Monitoring and Tracking

**User Story:** As an administrator, I want to monitor vote activity in real-time, so that I can track engagement and detect anomalies.

#### Acceptance Criteria

1. WHEN an Admin_User views the dashboard, THE Vote_Monitor SHALL display recent votes with voter identifier, amount, candidate name, and timestamp
2. THE Vote_Monitor SHALL mask voter identifiers by keeping only the first 3 and last 3 characters with asterisks in between
3. WHEN displaying vote activity, THE Vote_Monitor SHALL show the time elapsed since each vote (e.g., "Il y a 2 min")
4. THE Vote_Monitor SHALL display votes sorted by creation date in descending order (most recent first)
5. WHEN an Admin_User requests vote details, THE Admin_System SHALL include the Payment_Reference for traceability
6. THE Vote_Monitor SHALL display vote status (PENDING, SUCCESS, FAILED) with appropriate visual indicators
7. WHEN filtering votes by status, THE Vote_Monitor SHALL only include votes matching the specified Vote_Status

### Requirement 5: Financial Management and Withdrawals

**User Story:** As an administrator, I want to manage financial transactions and process withdrawal requests, so that I can handle platform revenue correctly.

#### Acceptance Criteria

1. WHEN an Admin_User initiates a withdrawal, THE Financial_Manager SHALL validate that the requested amount is greater than zero
2. WHEN a withdrawal is initiated, THE Financial_Manager SHALL calculate a fee of 3% of the requested amount rounded down to the nearest integer
3. WHEN a withdrawal is initiated, THE Financial_Manager SHALL calculate the net amount as requested amount minus fee amount
4. WHEN a withdrawal is created successfully, THE Financial_Manager SHALL store the withdrawal with status PENDING
5. THE Financial_Manager SHALL record requestedAmount, feeAmount, netAmount, status, and createdAt timestamp for each withdrawal
6. WHEN an Admin_User views withdrawals, THE Admin_System SHALL display all withdrawal records sorted by creation date in descending order
7. THE Financial_Manager SHALL support updating withdrawal status from PENDING to COMPLETED after processing
8. WHEN calculating total revenue, THE Dashboard_Service SHALL sum all amounts from votes with status SUCCESS

### Requirement 6: Data Export and Reporting

**User Story:** As an administrator, I want to export vote and withdrawal data to CSV files, so that I can perform external analysis and maintain financial records.

#### Acceptance Criteria

1. WHEN an Admin_User requests a votes export, THE Export_Engine SHALL generate a CSV file containing all SUCCESS votes
2. THE Export_Engine SHALL include a UTF-8 BOM at the beginning of all CSV files to ensure proper encoding in Excel
3. THE Export_Engine SHALL use semicolon (;) as the field separator in all CSV files
4. WHEN generating a votes CSV, THE Export_Engine SHALL include columns: ID Vote, Artiste, Identifiant Votant, Référence Mavians, Montant (FCFA), Date
5. WHEN generating a votes CSV, THE Export_Engine SHALL mask voter identifiers using the same pattern as Vote_Monitor (first 3 + *** + last 3 characters)
6. WHEN generating a votes CSV, THE Export_Engine SHALL format dates in ISO 8601 format
7. WHEN generating a votes CSV, THE Export_Engine SHALL enclose artist names in double quotes to handle special characters
8. WHEN an Admin_User requests a withdrawals export, THE Export_Engine SHALL generate a CSV file containing all withdrawal records
9. WHEN generating a withdrawals CSV, THE Export_Engine SHALL include columns: ID Retrait, Montant Brut (FCFA), Frais 3% (FCFA), Montant Net (FCFA), Statut, Date
10. THE Export_Engine SHALL set HTTP header Content-Type to "text/csv; charset=utf-8" for CSV downloads
11. THE Export_Engine SHALL set HTTP header Content-Disposition to trigger automatic file download with appropriate filename
12. WHEN generating CSV exports, THE Export_Engine SHALL sort records by date in descending order (most recent first)

### Requirement 7: Site Configuration Management

**User Story:** As an administrator, I want to update site configuration dynamically, so that I can modify platform settings without redeploying the application.

#### Acceptance Criteria

1. WHEN an Admin_User updates configuration, THE Config_Store SHALL accept an array of key-value pairs
2. WHEN updating a configuration key that exists, THE Config_Store SHALL update the configValue field only
3. WHEN updating a configuration key that does not exist, THE Config_Store SHALL create a new record with configKey and configValue
4. THE Config_Store SHALL execute all configuration updates within a single database transaction
5. WHEN any configuration update fails, THE Config_Store SHALL roll back all updates in the transaction
6. THE Config_Store SHALL automatically update the updatedAt timestamp for modified configuration records
7. THE Config_Store SHALL store configuration values as text to support various data types (strings, numbers, JSON)
8. WHEN configuration is successfully updated, THE Admin_System SHALL return a success confirmation

### Requirement 8: User Interface Navigation and Layout

**User Story:** As an administrator, I want an intuitive dashboard interface with clear navigation, so that I can efficiently access all administrative functions.

#### Acceptance Criteria

1. THE Admin_System SHALL display a sidebar navigation menu with sections: Vue d'ensemble, Candidats, Votes & Catégories, Finances, Paramètres
2. THE Admin_System SHALL highlight the currently active navigation section
3. THE Admin_System SHALL display a logout button in the sidebar that clears the Auth_Token and redirects to the home page
4. THE Admin_System SHALL display statistics cards showing totalCandidates, totalVotes, totalRevenue, and pendingWithdrawals
5. THE Admin_System SHALL use visual indicators (colors and icons) to distinguish different metric types
6. THE Admin_System SHALL display a search input field in the top bar for quick content search
7. THE Admin_System SHALL display a notification icon with an indicator badge for pending actions
8. THE Admin_System SHALL be responsive and adapt layout for desktop, tablet, and mobile screen sizes
9. WHEN statistics data is loading, THE Admin_System SHALL display loading indicators to inform the user
10. WHEN an API error occurs, THE Admin_System SHALL display a user-friendly error message

### Requirement 9: Candidate Table Display and Filtering

**User Story:** As an administrator, I want to view candidate information in a structured table, so that I can quickly assess candidate status and performance.

#### Acceptance Criteria

1. THE Admin_System SHALL display a candidates table with columns: Nom, Catégorie, Votes, Statut
2. THE Admin_System SHALL display candidate names using firstName and lastName concatenated
3. THE Admin_System SHALL display the category name for each candidate
4. THE Admin_System SHALL display the totalVotesCache value in the Votes column
5. THE Admin_System SHALL display candidate status with color-coded indicators (green for Actif, orange for En attente)
6. THE Admin_System SHALL support sorting candidates by vote count in the table
7. THE Admin_System SHALL display the most recently added candidates in the "Candidats Récents" section
8. WHEN a candidate row is hovered, THE Admin_System SHALL highlight the row to improve usability
9. THE Admin_System SHALL provide a "Voir tout" link to navigate to the full candidates management page

### Requirement 10: Real-Time Vote Activity Feed

**User Story:** As an administrator, I want to see a live feed of recent votes, so that I can monitor voting activity as it happens.

#### Acceptance Criteria

1. THE Admin_System SHALL display a "Derniers Votes" panel showing the most recent vote transactions
2. WHEN displaying vote entries, THE Admin_System SHALL show masked voter identifier, amount, candidate name, and time elapsed
3. THE Admin_System SHALL display vote amounts in FCFA with the + prefix to indicate revenue
4. THE Admin_System SHALL use color coding to highlight vote amounts (emerald for successful transactions)
5. THE Admin_System SHALL format time elapsed in French (e.g., "Il y a 2 min", "Il y a 1 h")
6. THE Admin_System SHALL display vote entries in rounded cards with border and background styling
7. THE Admin_System SHALL limit the vote activity feed to the 4 most recent votes to avoid clutter
8. WHEN new votes occur, THE Admin_System SHALL update the feed automatically (if real-time updates are implemented)

### Requirement 11: Parser and Pretty Printer for Configuration Files

**User Story:** As a developer, I want to parse and format site configuration data, so that I can programmatically manage configuration settings.

#### Acceptance Criteria

1. WHEN a configuration key-value pair is provided, THE Config_Parser SHALL parse it into a structured Configuration object
2. WHEN an invalid configuration format is provided, THE Config_Parser SHALL return a descriptive error message
3. THE Config_Pretty_Printer SHALL format Configuration objects into valid key-value pairs
4. FOR ALL valid Configuration objects, parsing then printing then parsing SHALL produce an equivalent object (round-trip property)
5. THE Config_Parser SHALL validate that configKey is a non-empty string
6. THE Config_Parser SHALL accept configValue as text to support various data types
7. THE Config_Pretty_Printer SHALL maintain consistent formatting for readability
8. THE Config_Parser SHALL handle special characters and whitespace in configuration values correctly

### Requirement 12: Error Handling and Validation

**User Story:** As an administrator, I want clear error messages when operations fail, so that I can understand and resolve issues quickly.

#### Acceptance Criteria

1. WHEN a required field is missing in a request, THE Admin_System SHALL return a 400 status code with a descriptive error message
2. WHEN a database constraint is violated (e.g., unique email), THE Admin_System SHALL return a 409 status code with a conflict explanation
3. WHEN an Admin_User attempts an unauthorized action, THE Admin_System SHALL return a 403 status code
4. WHEN a requested resource does not exist, THE Admin_System SHALL return a 404 status code
5. WHEN an external service (e.g., WhatsApp, payment gateway) fails, THE Admin_System SHALL return a 502 status code
6. WHEN a server error occurs, THE Admin_System SHALL return a 500 status code and log the error details
7. THE Admin_System SHALL validate all numeric inputs to ensure they are positive integers where applicable
8. THE Admin_System SHALL validate email addresses using a standard email format regex
9. THE Admin_System SHALL validate phone numbers to ensure they are in a valid format
10. WHEN validation fails, THE Admin_System SHALL return all validation errors in a structured format

