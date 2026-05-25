# ☕ Java Spring Boot Backend Architecture & SOLID Patterns

The Civic Pulse backend is built on **Java 17** and **Spring Boot 3.3.5**, conforming strictly to the **SOLID Design Principles** and clean architectural standards. It exposes REST API endpoints for citizen and officer dashboards, executes AI cognitive enrichment pipelines, and broadcasts live triage queue telemetry using a SockJS STOMP message broker.

---

## 🏗️ SOLID Compliance & Class Architecture

```
com.civicpulse.
├── controller/               # HTTP Rest Controller layer (Single Responsibility)
│   ├── AuthController.java   # JWT register, login, & blacklist logout
│   ├── ComplaintController.java # Incident submission, details, & queues
│   ├── AdminController.java  # Departments, Wards, & Officers console CRUD
│   └── AnalyticsController.java # SLA compliance & geographical density telemetry
├── service/                  # Business service interfaces and strategies
│   ├── ai/                   # AI services & Strategy integrations
│   │   ├── provider/         # Provider Strategy Pattern (Open/Closed)
│   │   │   ├── LlmProvider.java (Interface)
│   │   │   └── SpringAiLlmProvider.java (Spring AI Implementation)
│   │   └── AiController.java
│   ├── complaint/
│   │   ├── contract/         # Segregated Interfaces (Interface Segregation)
│   │   │   ├── ComplaintSubmissionService.java
│   │   │   ├── ComplaintRetrievalService.java
│   │   │   └── ComplaintStatusService.java
│   │   ├── impl/             # Service implementations
│   │   └── enrichment/       # AI Pipeline Chain of Responsibility
│   │       ├── ComplaintEnricher.java (Interface)
│   │       ├── AiCategorizationEnricher.java (NLP Category Classifier)
│   │       ├── AiSentimentEnricher.java (NLP Urgency Sentiment Analysis)
│   │       ├── SlaCalculationEnricher.java (SLA Target deadline setter)
│   │       └── ComplaintEnrichmentPipeline.java (Manager pipeline runner)
│   └── admin/
│       ├── contract/         # Segregated Admin Interfaces
│       │   ├── DepartmentAdminService.java
│       │   └── OfficerAdminService.java
│       └── impl/             # Admin implementations
├── model/                    # JPA Entities and Data Transfer Objects (DTOs)
├── repository/               # Spring Data JPA repositories (DIP)
└── config/                   # JWT Security Filters and WebSocket configs
```

---

## 🎯 Design Patterns & Core Implementations

### 1. Chain of Responsibility (AI Enrichment Pipeline)
* **Location:** `com.civicpulse.service.complaint.enrichment`
* **Mechanics:** When a citizen submits a complaint, the raw incident description is run through an AI Enrichment Pipeline.
* **Pipeline Links:**
  * **AiCategorizationEnricher:** Interfaces with the `LlmProvider` to classify the description into categories (e.g. Sanitation, Public Works, Traffic, Public Safety) automatically.
  * **AiSentimentEnricher:** Scores the urgency score and prioritizes the incident (Critical, High, Medium, Low) based on semantic danger.
  * **SlaCalculationEnricher:** Calculates the SLA due target date dynamically based on the calculated priority.

### 2. Provider & Strategy Pattern (AI LLM Provider)
* **Location:** `com.civicpulse.service.ai.provider`
* **Mechanics:** Implements a decoupled LLM abstraction. The `LlmProvider` interface defines generic completion tasks. The concrete `SpringAiLlmProvider` implements it using the Spring AI wrapper.
* **Benefit:** Ensures compliance with the **Dependency Inversion** and **Open/Closed** principles. Changing the underlying LLM vendor (e.g. from OpenAI to Anthropic or a local Ollama Llama3 model) requires zero changes to the core business logic.

### 3. Interface Segregation (Complaint Services)
* **Location:** `com.civicpulse.service.complaint.contract`
* **Mechanics:** Core services are split into highly cohesive, targeted interfaces rather than a monolithic database handler. Submitting complaints, retrieving feeds, and updating status workflows are isolated, guaranteeing clean contract decoupling.

---

## 🔒 Security & Data Infrastructure

* **Stateless JWT Security:** Employs a custom JWT filter interceptor. Access tokens are validated per-request and mapped to role-based access authorities (`CITIZEN`, `OFFICER`, `ADMIN`).
* **Session Blacklisting:** Realizes secure logout by blacklisting revoked JWT tokens in a high-speed Redis database.
* **Vector Similarity Database:** Uses **pgvector** to generate and index semantic vector embeddings. Implements vector similarity searches to detect duplicate submissions and support the Citizen RAG Q&A chatbot.
* **SockJS Message Broker:** WebSocket topics are secured and broadcasted dynamically under `/topic/complaints` to keep dispatchers instantly synchronized.

---

## 🛠️ Build & Compilation Commands

### 1. Compile & Package
Runs backend validation checks, runs unit tests, and packages a fat executable JAR inside `target/`:
```bash
./mvnw clean package
```

### 2. Boot Local Application
Starts the Spring Boot server on port `8080` with hot-swap support:
```bash
./mvnw spring-boot:run
```
