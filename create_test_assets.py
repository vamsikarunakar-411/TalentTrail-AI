import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

os.makedirs('test_fixtures', exist_ok=True)

# 1. Valid Candidate Resume PDF
c = canvas.Canvas('test_fixtures/valid_candidate_resume.pdf', pagesize=letter)
c.setFont("Helvetica-Bold", 18)
c.drawString(72, 740, "Vikram Malhotra")

c.setFont("Helvetica", 10)
c.drawString(72, 722, "vikram.malhotra@techlab.io | +1 (415) 890-3412 | San Francisco, CA")
c.drawString(72, 708, "LinkedIn: linkedin.com/in/vmalhotra | GitHub: github.com/vmalhotra")

c.setFont("Helvetica-Bold", 12)
c.drawString(72, 680, "PROFESSIONAL SUMMARY")
c.setFont("Helvetica", 10)
c.drawString(72, 664, "Full Stack Engineer with 4 years of experience building resilient microservices and React web applications.")

c.setFont("Helvetica-Bold", 12)
c.drawString(72, 636, "TECHNICAL SKILLS")
c.setFont("Helvetica", 10)
c.drawString(72, 620, "Languages: JavaScript, TypeScript, Python, SQL, HTML5, CSS3")
c.drawString(72, 606, "Frameworks & Libraries: React, Node.js, Express, Next.js, Jest, Tailwind CSS")
c.drawString(72, 592, "Databases & Cloud: PostgreSQL, MongoDB, Docker, Git, REST APIs, AWS, Redis")

c.setFont("Helvetica-Bold", 12)
c.drawString(72, 564, "WORK EXPERIENCE")
c.setFont("Helvetica-Bold", 10)
c.drawString(72, 548, "Senior Software Engineer")
c.setFont("Helvetica", 10)
c.drawString(72, 534, "Apex Cloud Solutions | 2022 - Present")
c.drawString(82, 520, "- Designed and deployed distributed Node.js microservices handling 4M daily transactions")
c.drawString(82, 506, "- Spearheaded frontend migration to React with TypeScript, cutting bundle load time by 38%")

c.setFont("Helvetica-Bold", 10)
c.drawString(72, 482, "Software Engineer Intern")
c.setFont("Helvetica", 10)
c.drawString(72, 468, "NextGen Robotics | 2021 - 2022")
c.drawString(82, 454, "- Developed real-time telemetry dashboards using React and Express")

c.setFont("Helvetica-Bold", 12)
c.drawString(72, 426, "EDUCATION")
c.setFont("Helvetica-Bold", 10)
c.drawString(72, 410, "B.S. in Computer Science")
c.setFont("Helvetica", 10)
c.drawString(72, 396, "Stanford University | 2017 - 2021")

c.setFont("Helvetica-Bold", 12)
c.drawString(72, 368, "KEY PROJECTS")
c.setFont("Helvetica-Bold", 10)
c.drawString(72, 352, "BerriAI Interview Assistant")
c.setFont("Helvetica", 10)
c.drawString(72, 338, "Conversational AI interviewer with PDF resume grounding built with React, Node.js, and Express.")

c.save()
print("1. Generated test_fixtures/valid_candidate_resume.pdf")

# 2. Non-PDF file (.txt)
with open('test_fixtures/invalid_resume.txt', 'w', encoding='utf-8') as f:
    f.write("This is a plain text file, not a valid PDF resume.\n")
print("2. Generated test_fixtures/invalid_resume.txt")

# 3. Non-PDF file (.docx pretend)
with open('test_fixtures/invalid_doc.docx', 'w', encoding='utf-8') as f:
    f.write("Fake docx content\n")
print("3. Generated test_fixtures/invalid_doc.docx")

# 4. Empty file (0 bytes)
with open('test_fixtures/empty_resume.pdf', 'wb') as f:
    pass
print("4. Generated test_fixtures/empty_resume.pdf (0 bytes)")

# 5. Oversized PDF (> 5 MB, e.g. 5.3 MB)
c_large = canvas.Canvas('test_fixtures/oversized_resume.pdf', pagesize=letter)
c_large.setFont("Helvetica", 12)
c_large.drawString(72, 700, "Oversized PDF Test Resume")
c_large.save()

# Pad PDF safely in comment stream to make it > 5 MB
current_size = os.path.getsize('test_fixtures/oversized_resume.pdf')
target_size = 5300000 # 5.3 MB
needed_padding = target_size - current_size

with open('test_fixtures/oversized_resume.pdf', 'rb') as f:
    pdf_bytes = f.read()

# Insert a PDF comment before %%EOF
eof_idx = pdf_bytes.rfind(b'%%EOF')
if eof_idx != -1:
    padding = b'\n% ' + (b'A' * (needed_padding - 10)) + b'\n'
    large_pdf = pdf_bytes[:eof_idx] + padding + pdf_bytes[eof_idx:]
else:
    large_pdf = pdf_bytes + (b'\n% ' + (b'A' * needed_padding))

with open('test_fixtures/oversized_resume.pdf', 'wb') as f:
    f.write(large_pdf)

print(f"5. Generated test_fixtures/oversized_resume.pdf ({os.path.getsize('test_fixtures/oversized_resume.pdf') / (1024*1024):.2f} MB)")
