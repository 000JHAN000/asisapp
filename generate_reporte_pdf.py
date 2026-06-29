import sys
import markdown
from html.parser import HTMLParser
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
    ListFlowable,
    ListItem,
    Image,
)


class MarkdownToReportlabParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.elements = []
        self.current_text = ""
        self.in_code_block = False
        self.code_text = ""
        self.list_stack = []
        self.list_item_text = ""
        self.table_data = []
        self.table_row = []
        self.table_cell = ""
        self.in_table = False
        self.in_table_header = False
        self.pending_tag = None
        self.link_href = None
        self.link_text = ""

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)

        if tag in ("h1", "h2", "h3", "p", "pre", "table", "thead", "tbody", "tr", "ul", "ol", "li", "hr", "a", "strong", "em", "code", "blockquote"):
            self.flush_text()

        if tag == "h1":
            self.pending_tag = "h1"
        elif tag == "h2":
            self.pending_tag = "h2"
        elif tag == "h3":
            self.pending_tag = "h3"
        elif tag == "p":
            self.pending_tag = "p"
        elif tag == "pre":
            self.in_code_block = True
            self.code_text = ""
        elif tag == "code" and not self.in_code_block:
            self.pending_tag = "code_inline"
        elif tag == "blockquote":
            self.pending_tag = "blockquote"
        elif tag == "a":
            self.link_href = attrs_dict.get("href", "")
            self.link_text = ""
        elif tag == "strong":
            self.pending_tag = "strong"
        elif tag == "em":
            self.pending_tag = "em"
        elif tag == "table":
            self.in_table = True
            self.table_data = []
        elif tag == "thead":
            self.in_table_header = True
        elif tag == "tbody":
            self.in_table_header = False
        elif tag == "tr":
            self.table_row = []
        elif tag == "th":
            self.pending_tag = "th"
        elif tag == "td":
            self.pending_tag = "td"
        elif tag == "ul":
            self.list_stack.append([])
        elif tag == "ol":
            self.list_stack.append([])
        elif tag == "li":
            self.list_item_text = ""
        elif tag == "hr":
            self.elements.append(Spacer(1, 12))

    def handle_endtag(self, tag):
        if tag == "p":
            self.flush_text()
            text = self.current_text.strip()
            if text:
                self.elements.append(Paragraph(text, styles["CustomBody"]))
                self.elements.append(Spacer(1, 6))
            self.current_text = ""
        elif tag == "h1":
            self.flush_text()
            self.elements.append(Paragraph(self.current_text.strip(), styles["CustomH1"]))
            self.elements.append(Spacer(1, 8))
            self.current_text = ""
        elif tag == "h2":
            self.flush_text()
            self.elements.append(Paragraph(self.current_text.strip(), styles["CustomH2"]))
            self.elements.append(Spacer(1, 6))
            self.current_text = ""
        elif tag == "h3":
            self.flush_text()
            self.elements.append(Paragraph(self.current_text.strip(), styles["CustomH3"]))
            self.elements.append(Spacer(1, 4))
            self.current_text = ""
        elif tag == "pre":
            self.in_code_block = False
            self.elements.append(Paragraph(self.code_text, styles["CustomCode"]))
            self.elements.append(Spacer(1, 6))
            self.code_text = ""
        elif tag == "code" and self.in_code_block:
            pass
        elif tag == "code":
            pass
        elif tag == "blockquote":
            self.flush_text()
            self.elements.append(Paragraph(self.current_text.strip(), styles["CustomBlockquote"]))
            self.elements.append(Spacer(1, 6))
            self.current_text = ""
        elif tag == "a":
            if self.link_href:
                self.current_text += f"<a href=\"{self.link_href}\" color=\"blue\">{self.link_text}</a>"
            else:
                self.current_text += self.link_text
            self.link_href = None
            self.link_text = ""
        elif tag in ("strong", "em"):
            self.flush_text()
        elif tag == "th":
            self.table_row.append(self.current_text.strip())
            self.current_text = ""
        elif tag == "td":
            self.table_row.append(self.current_text.strip())
            self.current_text = ""
        elif tag == "tr":
            if self.table_row:
                self.table_data.append(self.table_row)
        elif tag == "table":
            self.in_table = False
            if self.table_data:
                self.build_table()
            self.table_data = []
        elif tag == "li":
            if self.list_stack:
                self.list_stack[-1].append(self.current_text.strip())
            self.current_text = ""
        elif tag in ("ul", "ol"):
            if self.list_stack:
                items = self.list_stack.pop()
                list_items = [ListItem(Paragraph(item, styles["CustomListItem"])) for item in items if item]
                if list_items:
                    self.elements.append(ListFlowable(list_items, bulletType="bullet" if tag == "ul" else "1"))
                    self.elements.append(Spacer(1, 6))

    def handle_data(self, data):
        if self.in_code_block:
            self.code_text += data
        elif self.link_href is not None:
            self.link_text += data
        else:
            self.current_text += data.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    def flush_text(self):
        if self.pending_tag == "strong":
            self.current_text = f"<b>{self.current_text}</b>"
        elif self.pending_tag == "em":
            self.current_text = f"<i>{self.current_text}</i>"
        elif self.pending_tag == "code_inline":
            self.current_text = f"<font face=\"Courier\">{self.current_text}</font>"
        self.pending_tag = None

    def build_table(self):
        data = self.table_data
        if not data:
            return
        col_widths = [4.5 * inch / len(data[0])] * len(data[0])
        table = Table(data, colWidths=col_widths, repeatRows=1)
        style = TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f2f2f2")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 9),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
            ("BACKGROUND", (0, 1), (-1, -1), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("FONTSIZE", (0, 1), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ])
        table.setStyle(style)
        self.elements.append(KeepTogether(table))
        self.elements.append(Spacer(1, 10))


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="CustomBody",
    fontSize=10,
    leading=13,
    spaceAfter=6,
))
styles.add(ParagraphStyle(
    name="CustomH1",
    fontSize=20,
    leading=24,
    textColor=colors.HexColor("#1a5276"),
    spaceAfter=10,
    fontName="Helvetica-Bold",
))
styles.add(ParagraphStyle(
    name="CustomH2",
    fontSize=16,
    leading=20,
    textColor=colors.HexColor("#1a5276"),
    spaceAfter=8,
    fontName="Helvetica-Bold",
))
styles.add(ParagraphStyle(
    name="CustomH3",
    fontSize=13,
    leading=16,
    textColor=colors.HexColor("#2874a6"),
    spaceAfter=6,
    fontName="Helvetica-Bold",
))
styles.add(ParagraphStyle(
    name="CustomCode",
    fontSize=8,
    leading=10,
    leftIndent=10,
    textColor=colors.HexColor("#333333"),
    fontName="Courier",
))
styles.add(ParagraphStyle(
    name="CustomListItem",
    fontSize=10,
    leading=13,
    spaceAfter=3,
))
styles.add(ParagraphStyle(
    name="CustomBlockquote",
    fontSize=10,
    leading=13,
    textColor=colors.HexColor("#1a5276"),
    fontName="Helvetica-Oblique",
))


def main():
    md_path = Path("docs/REPORTE_MULTITENANCY.md")
    pdf_path = Path("docs/REPORTE_MULTITENANCY.pdf")

    md_content = md_path.read_text(encoding="utf-8")

    # Convertir markdown a HTML
    html = markdown.markdown(
        md_content,
        extensions=["fenced_code", "tables", "toc"],
    )

    parser = MarkdownToReportlabParser()
    parser.feed(html)

    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=1 * inch,
        bottomMargin=1 * inch,
    )

    # Insertar portada e imagen al inicio
    cover = [
        Paragraph("Reporte de implementación multitenancy", styles["CustomH1"]),
        Paragraph("Chronogest — Database-per-Tenant", styles["CustomH2"]),
        Spacer(1, 20),
        Paragraph("Fecha: 2026-06-29", styles["CustomBody"]),
        Spacer(1, 20),
    ]

    diagram_path = Path("docs/diagrama_arquitectura.png")
    if diagram_path.exists():
        img = Image(str(diagram_path), width=6.5 * inch, height=4.4 * inch)
        cover.append(img)
        cover.append(Spacer(1, 20))

    doc.build(cover + parser.elements)
    print(f"PDF generado exitosamente: {pdf_path.resolve()}")


if __name__ == "__main__":
    main()
