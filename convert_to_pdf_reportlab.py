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
        elif tag == "table":
            self.in_table = True
            self.table_data = []
        elif tag == "thead":
            self.in_table_header = True
        elif tag == "tbody":
            self.in_table_header = False
        elif tag == "tr":
            self.table_row = []
        elif tag in ("td", "th"):
            self.table_cell = ""
        elif tag == "ul":
            self.list_stack.append(("bullet", []))
        elif tag == "ol":
            self.list_stack.append(("numbered", []))
        elif tag == "li":
            self.list_item_text = ""
        elif tag == "hr":
            self.elements.append(Spacer(1, 12))
            self.elements.append(Table([[""]], colWidths=[6.5 * inch], style=TableStyle([
                ("LINEBELOW", (0, 0), (-1, 0), 1, colors.HexColor("#2e86c1")),
            ])))
            self.elements.append(Spacer(1, 12))
        elif tag == "a":
            self.link_href = attrs_dict.get("href", "")
            self.link_text = ""
        elif tag == "strong":
            self.current_text += "<b>"
        elif tag == "em":
            self.current_text += "<i>"

    def handle_endtag(self, tag):
        if tag in ("h1", "h2", "h3", "p", "blockquote"):
            self.flush_text()
            if tag == "h1":
                self.elements.append(PageBreak())
            self.pending_tag = None

        elif tag == "pre":
            self.elements.append(Spacer(1, 6))
            self.elements.append(
                Table(
                    [[Paragraph(self.code_text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"), styles["CustomCode"])]],
                    colWidths=[6.5 * inch],
                    style=TableStyle([
                        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f4f6f7")),
                        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#d5dbdb")),
                        ("LEFTPADDING", (0, 0), (-1, -1), 8),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                        ("TOPPADDING", (0, 0), (-1, -1), 8),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                    ]),
                )
            )
            self.elements.append(Spacer(1, 6))
            self.in_code_block = False
            self.code_text = ""

        elif tag == "code" and self.pending_tag == "code_inline":
            self.pending_tag = None

        elif tag == "table":
            if self.table_data:
                num_cols = max(len(row) for row in self.table_data)
                col_width = 6.5 * inch / num_cols
                table = Table(self.table_data, colWidths=[col_width] * num_cols, repeatRows=1)
                table.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eaf2f8")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#1a5276")),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 9),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
                    ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f8f9f9")),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#bbb")),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ]))
                self.elements.append(Spacer(1, 8))
                self.elements.append(table)
                self.elements.append(Spacer(1, 8))
            self.in_table = False
            self.table_data = []

        elif tag == "tr":
            self.table_data.append(self.table_row)

        elif tag in ("td", "th"):
            self.table_row.append(Paragraph(self.table_cell.strip(), styles["CustomTableCell"]))

        elif tag == "ul":
            if self.list_stack:
                list_type, items = self.list_stack.pop()
                flow = ListFlowable(
                    items,
                    bulletType="bullet",
                    leftIndent=20,
                    bulletFontSize=8,
                    bulletColor=colors.HexColor("#2e86c1"),
                )
                if self.list_stack:
                    self.list_stack[-1][1].append(ListItem(flow))
                else:
                    self.elements.append(flow)
                    self.elements.append(Spacer(1, 4))

        elif tag == "ol":
            if self.list_stack:
                list_type, items = self.list_stack.pop()
                flow = ListFlowable(
                    items,
                    bulletType="1",
                    leftIndent=20,
                )
                if self.list_stack:
                    self.list_stack[-1][1].append(ListItem(flow))
                else:
                    self.elements.append(flow)
                    self.elements.append(Spacer(1, 4))

        elif tag == "li":
            if self.list_stack:
                self.list_stack[-1][1].append(
                    ListItem(Paragraph(self.list_item_text.strip(), styles["CustomListItem"]))
                )
            self.list_item_text = ""

        elif tag == "a":
            self.current_text += f'<a href="{self.link_href}" color="blue">{self.link_text}</a>'
            self.link_href = None
            self.link_text = ""

        elif tag == "strong":
            self.current_text += "</b>"
        elif tag == "em":
            self.current_text += "</i>"

    def handle_data(self, data):
        if self.in_code_block:
            self.code_text += data
        elif self.pending_tag == "code_inline":
            self.current_text += f'<font face="Courier" size="8" color="#c0392b">{data}</font>'
        elif self.link_href is not None:
            self.link_text += data
        elif self.in_table and (self.table_cell is not None):
            self.table_cell += data
        elif self.list_stack and self.list_item_text is not None:
            self.list_item_text += data
        else:
            self.current_text += data

    def flush_text(self):
        text = self.current_text.strip()
        if not text:
            return

        if self.pending_tag == "h1":
            self.elements.append(Paragraph(text, styles["CustomTitle"]))
            self.elements.append(Spacer(1, 12))
        elif self.pending_tag == "h2":
            self.elements.append(Paragraph(text, styles["CustomHeading2"]))
            self.elements.append(Spacer(1, 8))
        elif self.pending_tag == "h3":
            self.elements.append(Paragraph(text, styles["CustomHeading3"]))
            self.elements.append(Spacer(1, 6))
        elif self.pending_tag == "blockquote":
            self.elements.append(
                Table(
                    [[Paragraph(text, styles["CustomBlockquote"])]],
                    colWidths=[6.2 * inch],
                    style=TableStyle([
                        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#eaf2f8")),
                        ("LEFTPADDING", (0, 0), (-1, -1), 12),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                        ("TOPPADDING", (0, 0), (-1, -1), 8),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                    ]),
                )
            )
            self.elements.append(Spacer(1, 8))
        else:
            self.elements.append(Paragraph(text, styles["CustomBodyText"]))
            self.elements.append(Spacer(1, 6))

        self.current_text = ""


# Configurar estilos
global styles
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="CustomTitle",
    fontSize=20,
    leading=24,
    textColor=colors.HexColor("#1a5276"),
    spaceAfter=14,
    fontName="Helvetica-Bold",
))
styles.add(ParagraphStyle(
    name="CustomHeading2",
    fontSize=14,
    leading=18,
    textColor=colors.HexColor("#2874a6"),
    spaceAfter=8,
    fontName="Helvetica-Bold",
    borderWidth=0,
    borderColor=colors.HexColor("#d4e6f1"),
    borderPadding=5,
))
styles.add(ParagraphStyle(
    name="CustomHeading3",
    fontSize=12,
    leading=15,
    textColor=colors.HexColor("#2e86c1"),
    spaceAfter=6,
    fontName="Helvetica-Bold",
))
styles.add(ParagraphStyle(
    name="CustomBodyText",
    fontSize=10,
    leading=14,
    alignment=4,  # justify
    spaceAfter=6,
))
styles.add(ParagraphStyle(
    name="CustomCode",
    fontName="Courier",
    fontSize=7.5,
    leading=10,
    textColor=colors.HexColor("#333333"),
))
styles.add(ParagraphStyle(
    name="CustomTableCell",
    fontSize=8,
    leading=11,
    spaceAfter=2,
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
    md_path = Path("docs/sustentacion-multitenant.md")
    pdf_path = Path("docs/sustentacion-multitenant.pdf")

    md_content = md_path.read_text(encoding="utf-8")

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

    doc.build(parser.elements)
    print(f"PDF generado exitosamente: {pdf_path.resolve()}")


if __name__ == "__main__":
    main()
