import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

os.makedirs('test_fixtures/diverse', exist_ok=True)

# 1. Multi-line with initials and certifications
c1 = canvas.Canvas('test_fixtures/diverse/fixture_multiline_initials.pdf', pagesize=letter)
c1.setFont("Helvetica-Bold", 16)
c1.drawString(72, 740, "K. V. T. Karunakar Rao")
c1.setFont("Helvetica", 9)
c1.drawString(72, 725, "Email: karunakar.rao@example.com | Phone: +91 8309235309 | Visakhapatnam, AP")
c1.drawString(72, 712, "LinkedIn: linkedin.com/in/karunakar-rao | GitHub: github.com/karunakarao")

c1.setFont("Helvetica-Bold", 11)
c1.drawString(72, 685, "TECHNICAL SKILLS")
c1.setFont("Helvetica", 9)
c1.drawString(72, 670, "Languages: Java, Python, JavaScript, TypeScript, SQL, HTML5, CSS3")
c1.drawString(72, 658, "Frameworks: React, Node.js, Express, Spring Boot, Tailwind CSS")
c1.drawString(72, 646, "Tools & Platforms: Docker, Git, MySQL, MongoDB, ServiceNow, ATF")

c1.setFont("Helvetica-Bold", 11)
c1.drawString(72, 620, "TECHNICAL PROJECTS")
c1.setFont("Helvetica-Bold", 9)
c1.drawString(72, 605, "DevPrep-AI | React, Node.js, Google Gemini, WebSockets")
c1.setFont("Helvetica", 9)
c1.drawString(82, 592, "• Developed autonomous AI mock-interview assistant with real-time speech recognition.")
c1.drawString(82, 580, "• Built dynamic question generation grounded in uploaded candidate resume.")
c1.drawString(82, 568, "• Designed responsive dashboard supporting 6 regional languages.")

c1.setFont("Helvetica-Bold", 9)
c1.drawString(72, 545, "Smart Campus Portal | Spring Boot, React, MySQL")
c1.setFont("Helvetica", 9)
c1.drawString(82, 532, "• Automated academic attendance tracking and student lifecycle management.")
c1.drawString(82, 520, "• Reduced semester registration query time by 65% through optimized REST endpoints.")

c1.setFont("Helvetica-Bold", 11)
c1.drawString(72, 495, "CERTIFICATIONS & LICENSES")
c1.setFont("Helvetica", 9)
c1.drawString(82, 480, "• ServiceNow Certified System Administrator (Credential ID: VIP-SN-2026-0136)")
c1.drawString(82, 468, "• NPTEL Elite Certification in Cloud Computing & Distributed Systems")
c1.drawString(82, 456, "• Full Stack Web Development Certification (EXT-APSCHE_FSD-62481)")

c1.setFont("Helvetica-Bold", 11)
c1.drawString(72, 430, "EDUCATION")
c1.setFont("Helvetica-Bold", 9)
c1.drawString(72, 415, "Bachelor of Technology in Computer Science & Engineering")
c1.setFont("Helvetica", 9)
c1.drawString(72, 402, "Jawaharlal Nehru Technological University | 2021 - 2025 | CGPA: 8.4")
c1.save()
print("Created fixture_multiline_initials.pdf")

# 2. Mononym / Self-Taught with No Projects
c2 = canvas.Canvas('test_fixtures/diverse/fixture_mononym_minimal.pdf', pagesize=letter)
c2.setFont("Helvetica-Bold", 16)
c2.drawString(72, 740, "Priyanka")
c2.setFont("Helvetica", 9)
c2.drawString(72, 725, "priyanka.dev@gmail.com | +1 650-555-0199 | San Jose, CA")

c2.setFont("Helvetica-Bold", 11)
c2.drawString(72, 695, "CAREER SUMMARY")
c2.setFont("Helvetica", 9)
c2.drawString(72, 680, "Frontend Developer with 3 years of hands-on experience building modern, accessible React interfaces.")

c2.setFont("Helvetica-Bold", 11)
c2.drawString(72, 650, "TECHNICAL EXPERTISE")
c2.setFont("Helvetica", 9)
c2.drawString(72, 635, "React, JavaScript, TypeScript, CSS3, HTML5, Redux, Jest, Vite, Git")

c2.setFont("Helvetica-Bold", 11)
c2.drawString(72, 605, "PROFESSIONAL EXPERIENCE")
c2.setFont("Helvetica-Bold", 9)
c2.drawString(72, 590, "Frontend Engineer | Stellar Web Studio | 2022 - Present")
c2.setFont("Helvetica", 9)
c2.drawString(82, 577, "• Maintained reusable design systems used across 12 production client portals.")
c2.drawString(82, 565, "• Optimized Lighthouse performance scores from 64 to 98.")
c2.save()
print("Created fixture_mononym_minimal.pdf")

# 3. Academic Researcher with 3 projects & publications
c3 = canvas.Canvas('test_fixtures/diverse/fixture_academic_researcher.pdf', pagesize=letter)
c3.setFont("Helvetica-Bold", 16)
c3.drawString(72, 740, "Dr. Elena Rostova")
c3.setFont("Helvetica", 9)
c3.drawString(72, 725, "elena.rostova@research.edu • +44 20 7946 0912 • github.com/erostova • linkedin.com/in/elena-rostova")

c3.setFont("Helvetica-Bold", 11)
c3.drawString(72, 695, "ACADEMIC BACKGROUND")
c3.setFont("Helvetica-Bold", 9)
c3.drawString(72, 680, "Ph.D. in Computer Science & Distributed Systems")
c3.setFont("Helvetica", 9)
c3.drawString(72, 668, "Oxford University | 2018 - 2022")

c3.setFont("Helvetica-Bold", 11)
c3.drawString(72, 640, "RESEARCH & SOFTWARE PROJECTS")
c3.setFont("Helvetica-Bold", 9)
c3.drawString(72, 625, "Quantum Circuit Simulator (Python, C++, NumPy)")
c3.setFont("Helvetica", 9)
c3.drawString(82, 612, "• High-performance state-vector emulator supporting up to 34 qubits with OpenMP acceleration.")

c3.setFont("Helvetica-Bold", 9)
c3.drawString(72, 590, "Neural Graph Network | PyTorch, Python, Docker")
c3.setFont("Helvetica", 9)
c3.drawString(82, 577, "• Deep learning framework for molecular property prediction on bio-chemical datasets.")

c3.setFont("Helvetica-Bold", 9)
c3.drawString(72, 555, "Distributed Matrix Engine | Go, gRPC, Redis")
c3.setFont("Helvetica", 9)
c3.drawString(82, 542, "• Fault-tolerant distributed linear algebra computational cluster.")

c3.setFont("Helvetica-Bold", 11)
c3.drawString(72, 515, "CORE COMPETENCIES")
c3.setFont("Helvetica", 9)
c3.drawString(72, 500, "Python, Go, C++, PyTorch, Docker, Kubernetes, Linux, Git, Distributed Systems")
c3.save()
print("Created fixture_academic_researcher.pdf")

# 4. Pipe Separated Header
c4 = canvas.Canvas('test_fixtures/diverse/fixture_pipe_separated_header.pdf', pagesize=letter)
c4.setFont("Helvetica-Bold", 14)
c4.drawString(72, 740, "Alex Chen | alex.chen@startup.io | (408) 555-0143 | San Jose, CA")

c4.setFont("Helvetica-Bold", 11)
c4.drawString(72, 710, "WORK HISTORY")
c4.setFont("Helvetica-Bold", 9)
c4.drawString(72, 695, "Senior Full Stack Engineer at NovaTech (2021 - Present)")
c4.setFont("Helvetica", 9)
c4.drawString(82, 682, "• Built payment orchestration microservices in Node.js and PostgreSQL.")

c4.setFont("Helvetica-Bold", 9)
c4.drawString(72, 660, "Software Engineer at ByteFlow (2019 - 2021)")
c4.setFont("Helvetica", 9)
c4.drawString(82, 647, "• Created customer telemetry dashboards with React and GraphQL.")

c4.setFont("Helvetica-Bold", 11)
c4.drawString(72, 620, "PROJECT EXPERIENCE")
c4.setFont("Helvetica-Bold", 9)
c4.drawString(72, 605, "CloudMetrics — Real-Time Infrastructure Monitoring Dashboard")
c4.setFont("Helvetica", 9)
c4.drawString(82, 592, "• Open-source telemetry visualizer built with TypeScript, React, and WebSocket streaming.")

c4.setFont("Helvetica-Bold", 11)
c4.drawString(72, 565, "EDUCATION")
c4.setFont("Helvetica-Bold", 9)
c4.drawString(72, 550, "B.S. in Software Engineering")
c4.setFont("Helvetica", 9)
c4.drawString(72, 538, "San Jose State University | 2015 - 2019")
c4.save()
print("Created fixture_pipe_separated_header.pdf")

# 5. Irregular Spacing & All-Caps Name
c5 = canvas.Canvas('test_fixtures/diverse/fixture_irregular_spacing_caps.pdf', pagesize=letter)
c5.setFont("Helvetica-Bold", 18)
c5.drawString(72, 740, "SARAH CONNOR")
c5.setFont("Helvetica", 9)
c5.drawString(72, 722, "sarah.connor@defense.org  *  +1 (310) 555-0199  *  Los Angeles, CA")

c5.setFont("Helvetica-Bold", 11)
c5.drawString(72, 690, "--- TECHNICAL EXPERTISE ---")
c5.setFont("Helvetica", 9)
c5.drawString(72, 675, "Python, C++, Linux, Docker, Cyber Security, Network Engineering, AWS")

c5.setFont("Helvetica-Bold", 11)
c5.drawString(72, 645, "--- KEY PROJECTS ---")
c5.setFont("Helvetica-Bold", 9)
c5.drawString(72, 630, "Autonomous Threat Radar: Real-time network intrusion detection")
c5.setFont("Helvetica", 9)
c5.drawString(82, 617, "• Implemented packet filtering engine in C++ and Python.")

c5.setFont("Helvetica-Bold", 9)
c5.drawString(72, 595, "Hardened Kernel Container (Docker, Linux)")
c5.setFont("Helvetica", 9)
c5.drawString(82, 582, "• Built immutable Linux container sandbox for secure payload testing.")

c5.setFont("Helvetica-Bold", 11)
c5.drawString(72, 550, "--- EDUCATION ---")
c5.setFont("Helvetica-Bold", 9)
c5.drawString(72, 535, "B.S. in Computer Systems Engineering")
c5.setFont("Helvetica", 9)
c5.drawString(72, 522, "University of California, Los Angeles | 2016 - 2020")
c5.save()
print("Created fixture_irregular_spacing_caps.pdf")

# 6. Scanned image stub (PDF with zero selectable text)
c6 = canvas.Canvas('test_fixtures/diverse/fixture_scanned_stub.pdf', pagesize=letter)
# Drawing an empty rectangle simulating an image frame without text
c6.rect(72, 100, 468, 600)
c6.save()
print("Created fixture_scanned_stub.pdf")
