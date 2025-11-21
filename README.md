🌐 https://anasjavith.github.io/Tawheed/


For Hadith Contributors:

Adding New Chapters

All chapters are stored inside the /hadiths/ directory.

To create a new entry:

Create a new .txt file inside hadiths/

Add an entry inside hadiths.json:

{
  "title": "Chapter title",
  "file": "Chapter title.txt"
}

The order of chapters is the order of the JSON array.



Supported Text Format

Each chapter must follow the simple tag structure defined in parser.js.

Title

[TITLE] 

Title text

Content Paragraphs

[CONTENT]

Any Tamil or English explanation text.

Paragraphs are separated automatically.


Qur’anic Verse Block

[QURAN]

Arabic line 1

Arabic line 2

Arabic line 3

(verse reference)

Example:

[QURAN]
وَلَنَبْلُوَنَّكُمْ بِشَیْءٍ مِّنَ الْخَوْفِ
(அல் குர்ஆன் 2:155)

This behaviour is based on the logic in the parser
