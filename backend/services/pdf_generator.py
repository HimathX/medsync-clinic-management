"""
PDF Generator Service for MedSync Reports
Generates professional, formatted PDF reports
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas
from io import BytesIO
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class PDFGenerator:
    """Professional PDF Generator for medical reports"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#7c3aed'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Subtitle style
        self.styles.add(ParagraphStyle(
            name='CustomSubtitle',
            parent=self.styles['Normal'],
            fontSize=12,
            textColor=colors.HexColor('#64748b'),
            spaceAfter=20,
            alignment=TA_CENTER,
            fontName='Helvetica'
        ))
        
        # Section header style
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#1a2332'),
            spaceAfter=12,
            spaceBefore=20,
            fontName='Helvetica-Bold'
        ))
        
        # Info text style
        self.styles.add(ParagraphStyle(
            name='InfoText',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#475569'),
            spaceAfter=6,
            fontName='Helvetica'
        ))
    
    def _add_header_footer(self, canvas, doc):
        """Add header and footer to each page"""
        canvas.saveState()
        
        # Header
        canvas.setFont('Helvetica-Bold', 10)
        canvas.setFillColor(colors.HexColor('#7c3aed'))
        canvas.drawString(50, A4[1] - 40, "MedSync Clinic Management System")
        
        # Footer
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(colors.HexColor('#64748b'))
        canvas.drawString(50, 30, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        canvas.drawRightString(A4[0] - 50, 30, f"Page {doc.page}")
        
        canvas.restoreState()
    
    def generate_branch_appointment_summary(self, data, date_from=None, date_to=None):
        """
        Generate Branch-wise Appointment Summary PDF
        
        Args:
            data: List of records from branch_appointment_daily_summary view
            date_from: Optional start date filter
            date_to: Optional end date filter
        
        Returns:
            BytesIO: PDF file buffer
        """
        try:
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=60, bottomMargin=60)
            elements = []
            
            # Title
            title = Paragraph("Branch-wise Appointment Summary", self.styles['CustomTitle'])
            elements.append(title)
            
            # Date range subtitle
            if date_from and date_to:
                subtitle = Paragraph(
                    f"Period: {date_from} to {date_to}",
                    self.styles['CustomSubtitle']
                )
            else:
                subtitle = Paragraph(
                    f"Generated on {datetime.now().strftime('%B %d, %Y')}",
                    self.styles['CustomSubtitle']
                )
            elements.append(subtitle)
            elements.append(Spacer(1, 20))
            
            # Summary statistics
            total_appointments = sum(int(row['appointment_count']) for row in data)
            unique_branches = len(set(row['branch_name'] for row in data))
            
            summary_data = [
                ['Total Appointments:', str(total_appointments)],
                ['Branches:', str(unique_branches)],
                ['Report Date:', datetime.now().strftime('%Y-%m-%d %H:%M')]
            ]
            
            summary_table = Table(summary_data, colWidths=[2.5*inch, 3*inch])
            summary_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
                ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#475569')),
                ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1a2332')),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
                ('PADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0'))
            ]))
            elements.append(summary_table)
            elements.append(Spacer(1, 30))
            
            # Data table
            section_header = Paragraph("Appointment Details by Branch", self.styles['SectionHeader'])
            elements.append(section_header)
            elements.append(Spacer(1, 10))
            
            # Table headers
            table_data = [['Branch Name', 'Date', 'Status', 'Count']]
            
            # Group data by branch
            branch_totals = {}
            for row in data:
                branch = row['branch_name']
                date = row['available_date'].strftime('%Y-%m-%d') if hasattr(row['available_date'], 'strftime') else str(row['available_date'])
                status = row['status']
                count = str(row['appointment_count'])
                
                table_data.append([branch, date, status, count])
                
                # Calculate branch totals
                if branch not in branch_totals:
                    branch_totals[branch] = 0
                branch_totals[branch] += int(row['appointment_count'])
            
            # Add totals row only if there's data
            if len(data) > 0:
                table_data.append(['', '', 'TOTAL', str(total_appointments)])
            
            # Create table
            col_widths = [2*inch, 1.5*inch, 1.5*inch, 1*inch]
            table = Table(table_data, colWidths=col_widths, repeatRows=1)
            
            # Table styling
            style_list = [
                # Header row
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#7c3aed')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                
                # Data rows
                ('BACKGROUND', (0, 1), (-1, -2 if len(data) > 0 else -1), colors.white),
                ('TEXTCOLOR', (0, 1), (-1, -2 if len(data) > 0 else -1), colors.HexColor('#1a2332')),
                ('FONTNAME', (0, 1), (-1, -2 if len(data) > 0 else -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -2 if len(data) > 0 else -1), 9),
                ('ROWBACKGROUNDS', (0, 1), (-1, -2 if len(data) > 0 else -1), [colors.white, colors.HexColor('#f8fafc')]),
                
                # All cells
                ('ALIGN', (3, 0), (3, -1), 'CENTER'),
                ('ALIGN', (2, 0), (2, -1), 'CENTER'),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
                ('PADDING', (0, 0), (-1, -1), 8),
            ]
            
            # Add total row styling only if there's data
            if len(data) > 0:
                style_list.extend([
                    ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#10b981')),
                    ('TEXTCOLOR', (0, -1), (-1, -1), colors.white),
                    ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, -1), (-1, -1), 11),
                ])
            
            table.setStyle(TableStyle(style_list))
            
            elements.append(table)
            
            # Build PDF
            doc.build(elements, onFirstPage=self._add_header_footer, onLaterPages=self._add_header_footer)
            
            buffer.seek(0)
            return buffer
            
        except Exception as e:
            logger.error(f"Error generating branch appointment summary PDF: {str(e)}")
            raise
    
    def generate_doctor_revenue_report(self, data, year=None, month=None):
        """
        Generate Doctor-wise Revenue Report PDF
        
        Args:
            data: List of records from doctor_monthly_revenue view
            year: Optional year filter
            month: Optional month filter
        
        Returns:
            BytesIO: PDF file buffer
        """
        try:
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=60, bottomMargin=60)
            elements = []
            
            # Get doctor name if single doctor data
            doctor_names = list(set(row['doctor_name'] for row in data)) if data else []
            doctor_name_display = doctor_names[0] if len(doctor_names) == 1 else None
            
            # Title
            if doctor_name_display:
                title = Paragraph(f"Revenue Report - {doctor_name_display}", self.styles['CustomTitle'])
            else:
                title = Paragraph("Doctor-wise Revenue Report", self.styles['CustomTitle'])
            elements.append(title)
            
            # Subtitle
            if year and month:
                subtitle = Paragraph(
                    f"Period: {year}-{month}",
                    self.styles['CustomSubtitle']
                )
            elif year:
                subtitle = Paragraph(
                    f"Year: {year}",
                    self.styles['CustomSubtitle']
                )
            else:
                subtitle = Paragraph(
                    f"All Time Revenue Report",
                    self.styles['CustomSubtitle']
                )
            elements.append(subtitle)
            elements.append(Spacer(1, 20))
            
            # Summary statistics
            total_revenue = sum(float(row['revenue']) for row in data)
            unique_doctors = len(set(row['doctor_id'] for row in data))
            avg_revenue = total_revenue / unique_doctors if unique_doctors > 0 else 0
            
            summary_data = [
                ['Total Revenue:', f"LKR {total_revenue:,.2f}"],
                ['Number of Doctors:', str(unique_doctors)],
                ['Average Revenue/Doctor:', f"LKR {avg_revenue:,.2f}"],
                ['Report Generated:', datetime.now().strftime('%Y-%m-%d %H:%M')]
            ]
            
            summary_table = Table(summary_data, colWidths=[2.5*inch, 3*inch])
            summary_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f0f9ff')),
                ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#475569')),
                ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1a2332')),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
                ('PADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#0ea5e9'))
            ]))
            elements.append(summary_table)
            elements.append(Spacer(1, 30))
            
            # Data table
            section_header = Paragraph("Revenue Details by Doctor", self.styles['SectionHeader'])
            elements.append(section_header)
            elements.append(Spacer(1, 10))
            
            # Table headers
            table_data = [['Month', 'Revenue (LKR)', '% of Total']]
            
            # Add data rows
            for row in data:
                month = row['month'] if row['month'] else 'N/A'
                revenue = float(row['revenue'])
                percentage = (revenue / total_revenue * 100) if total_revenue > 0 else 0
                
                table_data.append([
                    month,
                    f"{revenue:,.2f}",
                    f"{percentage:.1f}%"
                ])
            
            # Add total row only if there's data
            if len(data) > 0:
                table_data.append(['TOTAL', f"{total_revenue:,.2f}", '100%'])
            
            # Create table
            col_widths = [2.5*inch, 2*inch, 1.5*inch]
            table = Table(table_data, colWidths=col_widths, repeatRows=1)
            
            # Table styling
            style_list = [
                # Header row
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0ea5e9')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                
                # Data rows (only if we have data rows before total)
                ('BACKGROUND', (0, 1), (-1, -2 if len(data) > 0 else -1), colors.white),
                ('TEXTCOLOR', (0, 1), (-1, -2 if len(data) > 0 else -1), colors.HexColor('#1a2332')),
                ('FONTNAME', (0, 1), (-1, -2 if len(data) > 0 else -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -2 if len(data) > 0 else -1), 9),
                ('ROWBACKGROUNDS', (0, 1), (-1, -2 if len(data) > 0 else -1), [colors.white, colors.HexColor('#f0f9ff')]),
                
                # All cells alignment
                ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
                ('PADDING', (0, 0), (-1, -1), 8),
            ]
            
            # Add total row styling only if there's data
            if len(data) > 0:
                style_list.extend([
                    ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#10b981')),
                    ('TEXTCOLOR', (0, -1), (-1, -1), colors.white),
                    ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, -1), (-1, -1), 11),
                ])
            
            table.setStyle(TableStyle(style_list))
            
            elements.append(table)
            
            # Build PDF
            doc.build(elements, onFirstPage=self._add_header_footer, onLaterPages=self._add_header_footer)
            
            buffer.seek(0)
            return buffer
            
        except Exception as e:
            logger.error(f"Error generating doctor revenue PDF: {str(e)}")
            raise
    
    def generate_outstanding_balance_report(self, data):
        """
        Generate Outstanding Patient Balances Report PDF
        
        Args:
            data: List of records from patients_outstanding_balances view
        
        Returns:
            BytesIO: PDF file buffer
        """
        try:
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=60, bottomMargin=60)
            elements = []
            
            # Title
            title = Paragraph("Patients with Outstanding Balances", self.styles['CustomTitle'])
            elements.append(title)
            
            # Subtitle
            subtitle = Paragraph(
                f"Report generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}",
                self.styles['CustomSubtitle']
            )
            elements.append(subtitle)
            elements.append(Spacer(1, 20))
            
            # Summary statistics
            total_outstanding = sum(float(row['patient_balance']) for row in data)
            patient_count = len(data)
            avg_balance = total_outstanding / patient_count if patient_count > 0 else 0
            
            summary_data = [
                ['Total Outstanding:', f"LKR {total_outstanding:,.2f}"],
                ['Number of Patients:', str(patient_count)],
                ['Average Balance:', f"LKR {avg_balance:,.2f}"],
                ['Report Date:', datetime.now().strftime('%Y-%m-%d %H:%M')]
            ]
            
            summary_table = Table(summary_data, colWidths=[2.5*inch, 3*inch])
            summary_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fef3c7')),
                ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#92400e')),
                ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1a2332')),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
                ('PADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#f59e0b'))
            ]))
            elements.append(summary_table)
            elements.append(Spacer(1, 30))
            
            # Warning message
            warning = Paragraph(
                "<b>⚠️ Action Required:</b> The following patients have outstanding balances that require follow-up.",
                self.styles['InfoText']
            )
            elements.append(warning)
            elements.append(Spacer(1, 15))
            
            # Data table
            section_header = Paragraph("Outstanding Balance Details", self.styles['SectionHeader'])
            elements.append(section_header)
            elements.append(Spacer(1, 10))
            
            # Table headers
            table_data = [['#', 'Patient Name', 'Outstanding Balance (LKR)', 'Status']]
            
            # Add data rows
            for idx, row in enumerate(data, 1):
                patient_name = row.get('patient_name', 'Unknown')
                balance = float(row['patient_balance'])
                
                # Determine status color based on balance
                if balance > 10000:
                    status = 'High'
                elif balance > 5000:
                    status = 'Medium'
                else:
                    status = 'Low'
                
                table_data.append([
                    str(idx),
                    patient_name,
                    f"{balance:,.2f}",
                    status
                ])
            
            # Add total row only if there's data
            if len(data) > 0:
                table_data.append(['', 'TOTAL', f"{total_outstanding:,.2f}", ''])
            
            # Create table
            col_widths = [0.5*inch, 2.5*inch, 2*inch, 1.5*inch]
            table = Table(table_data, colWidths=col_widths, repeatRows=1)
            
            # Table styling
            table_style = [
                # Header row
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f59e0b')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                
                # Data rows
                ('BACKGROUND', (0, 1), (-1, -2 if len(data) > 0 else -1), colors.white),
                ('TEXTCOLOR', (0, 1), (-1, -2 if len(data) > 0 else -1), colors.HexColor('#1a2332')),
                ('FONTNAME', (0, 1), (-1, -2 if len(data) > 0 else -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -2 if len(data) > 0 else -1), 9),
                ('ROWBACKGROUNDS', (0, 1), (-1, -2 if len(data) > 0 else -1), [colors.white, colors.HexColor('#fef3c7')]),
                
                # All cells
                ('ALIGN', (0, 0), (0, -1), 'CENTER'),
                ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
                ('ALIGN', (3, 0), (3, -1), 'CENTER'),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
                ('PADDING', (0, 0), (-1, -1), 8),
            ]
            
            # Add total row styling only if there's data
            if len(data) > 0:
                table_style.extend([
                    ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#ef4444')),
                    ('TEXTCOLOR', (0, -1), (-1, -1), colors.white),
                    ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, -1), (-1, -1), 11),
                ])
            
            # Add color coding for status
            for idx, row in enumerate(data, 1):
                balance = float(row['patient_balance'])
                if balance > 10000:
                    table_style.append(('TEXTCOLOR', (3, idx), (3, idx), colors.HexColor('#ef4444')))
                    table_style.append(('FONTNAME', (3, idx), (3, idx), 'Helvetica-Bold'))
                elif balance > 5000:
                    table_style.append(('TEXTCOLOR', (3, idx), (3, idx), colors.HexColor('#f59e0b')))
                    table_style.append(('FONTNAME', (3, idx), (3, idx), 'Helvetica-Bold'))
                else:
                    table_style.append(('TEXTCOLOR', (3, idx), (3, idx), colors.HexColor('#10b981')))
            
            table.setStyle(TableStyle(table_style))
            elements.append(table)
            
            # Add footer note
            elements.append(Spacer(1, 20))
            footer_note = Paragraph(
                "<b>Note:</b> Status levels - High: >10,000 LKR | Medium: 5,000-10,000 LKR | Low: <5,000 LKR",
                self.styles['InfoText']
            )
            elements.append(footer_note)
            
            # Build PDF
            doc.build(elements, onFirstPage=self._add_header_footer, onLaterPages=self._add_header_footer)
            
            buffer.seek(0)
            return buffer
            
        except Exception as e:
            logger.error(f"Error generating outstanding balance PDF: {str(e)}")
            raise
    
    def generate_treatments_by_category_report(self, data, date_from=None, date_to=None):
        """
        Generate Treatments by Category Report PDF
        
        Args:
            data: List of treatment records grouped by category
            date_from: Optional start date filter
            date_to: Optional end date filter
        
        Returns:
            BytesIO: PDF file buffer
        """
        try:
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=60, bottomMargin=60)
            elements = []
            
            # Title
            title = Paragraph("Treatment Analysis by Category", self.styles['CustomTitle'])
            elements.append(title)
            
            # Subtitle with date range
            if date_from and date_to:
                subtitle = Paragraph(
                    f"Period: {date_from} to {date_to}",
                    self.styles['CustomSubtitle']
                )
            else:
                subtitle = Paragraph(
                    f"All Time Treatment Report",
                    self.styles['CustomSubtitle']
                )
            elements.append(subtitle)
            elements.append(Spacer(1, 20))
            
            # Summary statistics
            total_treatments = sum(int(row['treatment_count']) for row in data)
            unique_categories = len(data)
            avg_per_category = total_treatments / unique_categories if unique_categories > 0 else 0
            total_revenue = sum(float(row['total_revenue']) for row in data)
            
            summary_data = [
                ['Total Treatments:', str(total_treatments)],
                ['Categories:', str(unique_categories)],
                ['Average/Category:', f"{avg_per_category:.1f}"],
                ['Total Revenue:', f"LKR {total_revenue:,.2f}"],
                ['Report Generated:', datetime.now().strftime('%Y-%m-%d %H:%M')]
            ]
            
            summary_table = Table(summary_data, colWidths=[2.5*inch, 3*inch])
            summary_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#ede9fe')),
                ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#6b21a8')),
                ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1a2332')),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
                ('PADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#a855f7'))
            ]))
            elements.append(summary_table)
            elements.append(Spacer(1, 30))
            
            # Data table
            section_header = Paragraph("Treatment Breakdown by Category", self.styles['SectionHeader'])
            elements.append(section_header)
            elements.append(Spacer(1, 10))
            
            # Table headers
            table_data = [['#', 'Treatment Category', 'Count', 'Revenue (LKR)', '% of Total']]
            
            # Add data rows
            for idx, row in enumerate(data, 1):
                category_name = row['treatment_name']
                count = int(row['treatment_count'])
                revenue = float(row['total_revenue'])
                percentage = (count / total_treatments * 100) if total_treatments > 0 else 0
                
                table_data.append([
                    str(idx),
                    category_name,
                    str(count),
                    f"{revenue:,.2f}",
                    f"{percentage:.1f}%"
                ])
            
            # Add total row only if there's data
            if len(data) > 0:
                table_data.append(['', 'TOTAL', str(total_treatments), f"{total_revenue:,.2f}", '100%'])
            
            # Create table
            col_widths = [0.5*inch, 2.5*inch, 1*inch, 1.5*inch, 1*inch]
            table = Table(table_data, colWidths=col_widths, repeatRows=1)
            
            # Table styling with gradient effect
            style_list = [
                # Header row
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8b5cf6')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                
                # Data rows
                ('BACKGROUND', (0, 1), (-1, -2 if len(data) > 0 else -1), colors.white),
                ('TEXTCOLOR', (0, 1), (-1, -2 if len(data) > 0 else -1), colors.HexColor('#1a2332')),
                ('FONTNAME', (0, 1), (-1, -2 if len(data) > 0 else -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -2 if len(data) > 0 else -1), 9),
                ('ROWBACKGROUNDS', (0, 1), (-1, -2 if len(data) > 0 else -1), [colors.white, colors.HexColor('#ede9fe')]),
                
                # All cells
                ('ALIGN', (0, 0), (0, -1), 'CENTER'),
                ('ALIGN', (2, 0), (2, -1), 'CENTER'),
                ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
                ('ALIGN', (4, 0), (4, -1), 'CENTER'),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
                ('PADDING', (0, 0), (-1, -1), 8),
            ]
            
            # Add total row styling only if there's data
            if len(data) > 0:
                style_list.extend([
                    ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#7c3aed')),
                    ('TEXTCOLOR', (0, -1), (-1, -1), colors.white),
                    ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, -1), (-1, -1), 11),
                ])
            
            table.setStyle(TableStyle(style_list))
            
            elements.append(table)
            
            # Add insights section
            elements.append(Spacer(1, 20))
            if data:
                top_treatment = max(data, key=lambda x: int(x['treatment_count']))
                insights = Paragraph(
                    f"<b>📊 Key Insight:</b> Most popular treatment is <b>{top_treatment['treatment_name']}</b> with {top_treatment['treatment_count']} treatments performed.",
                    self.styles['InfoText']
                )
                elements.append(insights)
            
            # Build PDF
            doc.build(elements, onFirstPage=self._add_header_footer, onLaterPages=self._add_header_footer)
            
            buffer.seek(0)
            return buffer
            
        except Exception as e:
            logger.error(f"Error generating treatments by category PDF: {str(e)}")
            raise
    
    def generate_insurance_vs_outofpocket_report(self, data, date_from=None, date_to=None):
        """
        Generate Insurance Coverage vs Out-of-Pocket Payments Report PDF
        
        Args:
            data: Dictionary with insurance and out-of-pocket payment data
            date_from: Optional start date filter
            date_to: Optional end date filter
        
        Returns:
            BytesIO: PDF file buffer
        """
        try:
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=60, bottomMargin=60)
            elements = []
            
            # Title
            title = Paragraph("Insurance Coverage vs Out-of-Pocket Analysis", self.styles['CustomTitle'])
            elements.append(title)
            
            # Subtitle
            if date_from and date_to:
                subtitle = Paragraph(
                    f"Period: {date_from} to {date_to}",
                    self.styles['CustomSubtitle']
                )
            else:
                subtitle = Paragraph(
                    f"All Time Payment Analysis",
                    self.styles['CustomSubtitle']
                )
            elements.append(subtitle)
            elements.append(Spacer(1, 20))
            
            # Calculate totals
            insurance_total = float(data.get('insurance_total', 0))
            out_of_pocket_total = float(data.get('out_of_pocket_total', 0))
            grand_total = insurance_total + out_of_pocket_total
            
            insurance_percentage = (insurance_total / grand_total * 100) if grand_total > 0 else 0
            out_of_pocket_percentage = (out_of_pocket_total / grand_total * 100) if grand_total > 0 else 0
            
            # Summary statistics
            summary_data = [
                ['Total Payments:', f"LKR {grand_total:,.2f}"],
                ['Insurance Covered:', f"LKR {insurance_total:,.2f}"],
                ['Out-of-Pocket:', f"LKR {out_of_pocket_total:,.2f}"],
                ['Insurance Coverage Rate:', f"{insurance_percentage:.1f}%"],
                ['Report Generated:', datetime.now().strftime('%Y-%m-%d %H:%M')]
            ]
            
            summary_table = Table(summary_data, colWidths=[2.5*inch, 3*inch])
            summary_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#dbeafe')),
                ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#1e40af')),
                ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1a2332')),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
                ('PADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#3b82f6'))
            ]))
            elements.append(summary_table)
            elements.append(Spacer(1, 30))
            
            # Visual comparison section
            section_header = Paragraph("Payment Method Comparison", self.styles['SectionHeader'])
            elements.append(section_header)
            elements.append(Spacer(1, 10))
            
            # Comparison table
            comparison_data = [
                ['Payment Method', 'Amount (LKR)', 'Percentage', 'Transaction Count'],
                [
                    'Insurance Coverage',
                    f"{insurance_total:,.2f}",
                    f"{insurance_percentage:.1f}%",
                    str(data.get('insurance_count', 0))
                ],
                [
                    'Out-of-Pocket',
                    f"{out_of_pocket_total:,.2f}",
                    f"{out_of_pocket_percentage:.1f}%",
                    str(data.get('out_of_pocket_count', 0))
                ]
            ]
            
            # Add total row only if there's data
            if grand_total > 0:
                comparison_data.append([
                    'TOTAL',
                    f"{grand_total:,.2f}",
                    '100%',
                    str(data.get('insurance_count', 0) + data.get('out_of_pocket_count', 0))
                ])
            
            comparison_table = Table(comparison_data, colWidths=[2*inch, 1.5*inch, 1.5*inch, 1.5*inch])
            
            style_list = [
                # Header row
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                
                # Insurance row
                ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#dbeafe')),
                ('TEXTCOLOR', (0, 1), (-1, 1), colors.HexColor('#1e40af')),
                ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 1), (-1, 1), 10),
                
                # Out-of-pocket row
                ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#fef3c7')),
                ('TEXTCOLOR', (0, 2), (-1, 2), colors.HexColor('#92400e')),
                ('FONTNAME', (0, 2), (-1, 2), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 2), (-1, 2), 10),
                
                # All cells
                ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
                ('ALIGN', (2, 0), (2, -1), 'CENTER'),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
                ('PADDING', (0, 0), (-1, -1), 10),
            ]
            
            # Add total row styling only if there's data
            if grand_total > 0:
                style_list.extend([
                    ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor('#10b981')),
                    ('TEXTCOLOR', (0, 3), (-1, 3), colors.white),
                    ('FONTNAME', (0, 3), (-1, 3), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 3), (-1, 3), 11),
                ])
            
            comparison_table.setStyle(TableStyle(style_list))
            elements.append(comparison_table)
            
            # Detailed breakdown if available
            if 'details' in data and data['details']:
                elements.append(Spacer(1, 30))
                section_header2 = Paragraph("Detailed Payment Breakdown", self.styles['SectionHeader'])
                elements.append(section_header2)
                elements.append(Spacer(1, 10))
                
                details_data = [['Payment Method', 'Patient Count', 'Avg Payment', 'Total Amount']]
                
                for detail in data['details']:
                    details_data.append([
                        detail['payment_method'],
                        str(detail.get('patient_count', 0)),
                        f"LKR {float(detail.get('avg_payment', 0)):,.2f}",
                        f"LKR {float(detail.get('total', 0)):,.2f}"
                    ])
                
                details_table = Table(details_data, colWidths=[2*inch, 1.5*inch, 1.5*inch, 1.5*inch])
                details_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#64748b')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
                    ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#1a2332')),
                    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 1), (-1, -1), 9),
                    ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
                    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
                    ('PADDING', (0, 0), (-1, -1), 8),
                ]))
                elements.append(details_table)
            
            # Add insights
            elements.append(Spacer(1, 20))
            if insurance_percentage > 50:
                insight_text = f"<b>💡 Insight:</b> Insurance coverage is strong at {insurance_percentage:.1f}%, indicating good insurance utilization by patients."
            else:
                insight_text = f"<b>💡 Insight:</b> Out-of-pocket payments dominate at {out_of_pocket_percentage:.1f}%. Consider promoting insurance enrollment programs."
            
            insights = Paragraph(insight_text, self.styles['InfoText'])
            elements.append(insights)
            
            # Build PDF
            doc.build(elements, onFirstPage=self._add_header_footer, onLaterPages=self._add_header_footer)
            
            buffer.seek(0)
            return buffer
            
        except Exception as e:
            logger.error(f"Error generating insurance vs out-of-pocket PDF: {str(e)}")
            raise


# Create singleton instance
pdf_generator = PDFGenerator()
