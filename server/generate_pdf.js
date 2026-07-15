import { mdToPdf } from 'md-to-pdf';
import fs from 'fs';

async function run() {
  console.log('⏳ Starting PDF generation...');
  try {
    const pdf = await mdToPdf(
      { path: 'server_documentation.md' },
      {
        launch_options: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
          ]
        }
      }
    );

    if (pdf && pdf.content) {
      fs.writeFileSync('server_documentation.pdf', pdf.content);
      console.log('✅ PDF generated successfully as server_documentation.pdf');
      process.exit(0);
    } else {
      console.error('❌ Failed to generate PDF: content is empty');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error during PDF generation:', error);
    process.exit(1);
  }
}

run();
