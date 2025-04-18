# Captain's Log: Gavel

## 2025-04-18: Two Steps Back, Half Step Forward

Two steps backward? A half step forward? Somewhere in between? Continuing to tinker as time allows, with life milestones in between. Dug into the PDF system and modularized to avoid breaking things amid development (D'oh!). Learning a lot. With this commit, there are fewer features but a stronger heart, with a fully offline rendering system using PDF.js. Lots to do from here; excited to do it!

## 2025-03-15: The Birth of Oak and Gavel

Today marks an important architectural decision in our project. Rather than building a monolithic application, we're separating our work into two distinct but connected projects:

1. **Oak** - A core multi-pane document workspace useful for any knowledge worker
2. **Gavel** - A legal-specific extension built on Oak for legal professionals

This separation gives us several advantages:

- Cleaner architecture with clear separation of concerns
- Ability to focus on getting the document workspace fundamentals right first
- Potential for Oak to be useful beyond the legal domain
- More focused development in our limited 15-minute development sessions

We've created our GitHub organization and initial repositories, and we're excited to begin building in the open.