# 👥 HabitParty (Gamified Productivity Engine)

An open-core productivity and gamification system featuring a strict mathematical economy for earning coins, combined with a flexible and friendly reward system. HabitParty is built to boost your productivity by ensuring that the user's real-world effort is converted into an exact currency value to redeem personal real-life rewards.

It is a system built primarily on your honesty and commitment!

## ✨ Key Features

*   **Task Management:** Clear workflow division between Habits, Dailies, and To-Dos.
*   **Strict Economy (Farming):** Coin (gold 🪙) earnings are strictly calculated based on the task's difficulty level (🟩Very Easy, 🟦Easy, 🟨Medium, 🟥Hard). Default reward values can be freely customized to fit your routine.
*   **Custom Rewards (Tags/Packages):** Users define the cost of their own real-life leisure rewards, categorizing them into tiered packages (e.g., Basic, Premium, Premium Plus) that scale time and quality proportionally to the cost.
    *   *Example:* Watch Videos (45min) - Basic costs 6 coins🪙.
    *   *Example:* Watch Videos (2h 30min) - Premium Plus costs 15 coins🪙.
    *   *Example:* Play Video Games (30min) - Basic costs 6 coins🪙.
*   **🎁 Mystery Boxes (Optional RNG):** It is possible to create rewards that rely on **RNG** (Random Number Generation). You can purchase a **Mystery Box** that will "roll a die" to select a reward from a predefined list within that box (based on rarities: Common, Rare, Epic, and Legendary).
*   **Focus Tools:** Built-in Pomodoro and Stopwatch seamlessly integrated into study-block mental workflows.
*   **👥 Social & Parties (Coming Soon):** Group formation ("Parties") with integrated chat functionality.
*   **Challenges (Coming Soon):** High-reward thematic tasks (focusing on Study, Health, etc.) that can be tackled solo or require the acceptance and cooperation of the entire Party.

## 🛠️ Tech Stack & Architecture

The system is designed with a focus on scalability, resilience, and Clean Code principles.

*   **Backend:** Java with Spring Boot (Microservices architecture).
*   **Architecture:** Hexagonal Architecture (Ports and Adapters) to completely isolate the economy's mathematical domain rules.
*   **Design Patterns:** 
    *   *Strategy:* For reward calculation based on task type and difficulty.
    *   *Factory Method:* For polymorphic task instantiation.
    *   *Observer:* Event decoupling via message brokers.
*   **Databases:** PostgreSQL (Primary Relational) and Redis (Caching for heavy analytical dashboards).
*   **Message Broker:** RabbitMQ for asynchronous, event-driven communication.
*   **Security:** Spring Security with stateless JWT authentication.
*   **API Documentation:** Swagger (OpenAPI 3.0) for interactive REST API testing and visual contracts.
*   **Infrastructure & DevOps:** Docker Compose (local orchestration), SonarQube (SAST/Code Quality), and GitHub Actions (CI/CD pipelines).
*   **Frontend:** React configured as a PWA (Progressive Web App) for offline-capable, mobile-first usage.

## ✅ Project Checklist

1. Use AI with Opencode and GitHub Copilot
2. Conceptual modeling in Lucidchart
3. Logical modeling in Lucidchart
4. Class and sequence modeling in Lucidchart using UML
5. Hexagonal folder structure modeling in Lucidchart
6. Create screens in Figma
7. Create the `docker-compose.yml` file
8. Configure the local environment with the essential services
9. Start the project with Maven and Spring Boot

## 📄 License

This project is distributed under the GNU Affero General Public License. See the `LICENSE` file for more details.