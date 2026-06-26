const name = process.argv[2] ?? 'art command';

console.error(`${name} is not available before explicit Gate A approval and production asset implementation.`);
console.error('Run npm run art:refs, npm run art:process, npm run art:contact-sheets, and npm run art:review-report for the current Gate A package.');
process.exit(1);
