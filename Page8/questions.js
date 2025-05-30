
const gameQuestions = [
    { list: "generalMeasurementInfo", score: 5 }, // Question 1
    { list: "exampleQuestions", score: 5 }, // Question 2
    { list: "areaCalculator", score: 5 }, // Question 3
    { list: "dimensionChecker", score: 5 }, // Question 4
    { list: "boundarySeparation", score: 5 }, // Question 5
    { list: "mediumBoundarySeparation", score: 5 }, // Question 6
    { list: "hardBoundarySeparation", score: 5 }, // Question 7
    { list: "removalAndSubtraction", score: 5 }, // Question 8
    { list: "hardRemovalAndSubtraction", score: 5 }, // Question 9
    { list: "inheritanceDivision", score: 5 }, // Question 10
    { list: "landValueCalculation", score: 10 }, // Question 11
    { list: "convertQasabToMeter", score: 10 }, // Question 12
    { list: "convertMeterToQasab", score: 10 }, // Question 13
    { list: "convertKiratToMeter", score: 10 }, // Question 14
    { list: "convertMeterToKirat", score: 10 }, // Question 15
];

const questions = {
  exampleQuestions: [
    // خمس اسئلة مثال كامل لتقسيم بين الاخوة
    {
            question:
              "كم قيراط لأرض طولها 120 مترًا وعرضها 15 مترًا تم القسمة على 175 متر؟",
            answers: [
              "10 قراريط و 6.85 سهم",
              "12 قيراط",
              "11 قيراط",
              "13 قيراط",
            ],
            correct: 0,
            guideLink: "../Page1/section1/index.html",
            sessionvars: {
              width1: "15",
              area1: "15",
              area2: "175",
              width2: "15",
              height: "120",
            },
          },
          {
            question:
              "كم قيراط لأرض طولها 80 مترًا وعرضها 25 مترًا تم القسمة على 175 متر؟",
            answers: [
              "11 قيراط و10.28 سهم",
              "10 قيراط",
              "12 قيراط",
              "13 قيراط",
            ],
            correct: 0,
            guideLink: "../Page1/section1/index.html",
            sessionvars: {
              width1: "25",
              area1: "25",
              area2: "175",
              width2: "25",
              height: "80",
            },
          },
          {
            question:
              "كم قيراط لأرض طولها 200 متر وعرضها 18 مترًا تم القسمة على 175 متر؟",
            answers: [
              "20 قيراط و 13.71 سهم",
              "22 قيراط",
              "21 قيراط",
              "19 قيراط",
            ],
            correct: 0,
            guideLink: "../Page1/section1/index.html",
            sessionvars: {
              width1: "18",
              area1: "18",
              area2: "175",
              width2: "18",
              height: "200",
            },
          },
          {
            question:
              "كم قيراط لأرض طولها 150 مترًا وعرضها 20 مترًا تم القسمة على 168 متر؟",
            answers: [
              "17 قيراط و20.57 سهم",
              "18 قيراط",
              "16 قيراط",
              "15 قيراط",
            ],
            correct: 0,
            guideLink: "../Page1/section1/index.html",
            sessionvars: {
              width1: "20",
              area1: "20",
              area2: "168",
              width2: "20",
              height: "150",
            },
          },
          {
            question:
              "كم قيراط لأرض طولها 120 مترًا وعرضها 15 مترًا تم القسمة على 168 متر؟",
            answers: [
              "10 قراريط و17.14 سهم",
              "11 قيراط",
              "12 قيراط",
              "9 قيراط",
            ],
            correct: 0,
            guideLink: "../Page1/section1/index.html",
            sessionvars: {
              width1: "15",
              area1: "15",
              area2: "168",
              width2: "15",
              height: "120",
            },
          },
          {
            question:
              "كم قيراط لأرض طولها 80 مترًا وعرضها 25 مترًا تم القسمة على 168 متر؟",
            answers: [
              "11 قيراط و 21.71 سمهم",
              "13 قيراط",
              "11 قيراط",
              "10 قيراط",
            ],
            correct: 0,
            guideLink: "../Page1/section1/index.html",
            sessionvars: {
              width1: "25",
              area1: "25",
              area2: "168",
              width2: "25",
              height: "80",
            },
          },
          {
            question:
              "كم قيراط لأرض طولها 200 متر وعرضها 18 مترًا تم القسمة على 168 متر؟",
            answers: [
              "21 قيراط",
              "21 قيراط و 10.28 سهم",
              "23 قيراط",
              "20 قيراط",
            ],
            correct: 1,
            guideLink: "../Page1/section1/index.html",
            sessionvars: {
              width1: "18",
              area1: "18",
              area2: "168",
              width2: "18",
              height: "200",
            },
          },
        ],
        areaCalculator: [
          // الاسئلة الاولي برنامج حساب المساحة
          {
            question:
              "كم قيراط لأرض طولها 120 مترًا وعرضها 15 مترًا تم القسمة على 175 متر؟",
            answers: [
              "10 قراريط و 6.85 سهم",
              "12 قيراط",
              "11 قيراط",
              "13 قيراط",
            ],
            correct: 0,
            guideLink: "../Page1/section1/index.html",
            sessionvars: {
              width1: "15",
              area1: "15",
              area2: "175",
              width2: "15",
              height: "120",
            },
          },
          {
            question:
              "كم قيراط لأرض طولها 80 مترًا وعرضها 25 مترًا تم القسمة على 175 متر؟",
            answers: [
              "11 قيراط و10.28 سهم",
              "10 قيراط",
              "12 قيراط",
              "13 قيراط",
            ],
            correct: 0,
            guideLink: "../Page1/section1/index.html",
            sessionvars: {
              width1: "25",
              area1: "25",
              area2: "175",
              width2: "25",
              height: "80",
            },
          },
          {
            question:
              "كم قيراط لأرض طولها 200 متر وعرضها 18 مترًا تم القسمة على 175 متر؟",
            answers: [
              "20 قيراط و 13.71 سهم",
              "22 قيراط",
              "21 قيراط",
              "19 قيراط",
            ],
            correct: 0,
            guideLink: "../Page1/section1/index.html",
            sessionvars: {
              width1: "18",
              area1: "18",
              area2: "175",
              width2: "18",
              height: "200",
            },
          },
          {
            question:
              "كم قيراط لأرض طولها 150 مترًا وعرضها 20 مترًا تم القسمة على 168 متر؟",
            answers: [
              "17 قيراط و20.57 سهم",
              "18 قيراط",
              "16 قيراط",
              "15 قيراط",
            ],
            correct: 0,
            guideLink: "../Page1/section1/index.html",
            sessionvars: {
              width1: "20",
              area1: "20",
              area2: "168",
              width2: "20",
              height: "150",
            },
          },
          {
            question:
              "كم قيراط لأرض طولها 120 مترًا وعرضها 15 مترًا تم القسمة على 168 متر؟",
            answers: [
              "10 قراريط و17.14 سهم",
              "11 قيراط",
              "12 قيراط",
              "9 قيراط",
            ],
            correct: 0,
            guideLink: "../Page1/section1/index.html",
            sessionvars: {
              width1: "15",
              area1: "15",
              area2: "168",
              width2: "15",
              height: "120",
            },
          },
          {
            question:
              "كم قيراط لأرض طولها 80 مترًا وعرضها 25 مترًا تم القسمة على 168 متر؟",
            answers: [
              "11 قيراط و 21.71 سمهم",
              "13 قيراط",
              "11 قيراط",
              "10 قيراط",
            ],
            correct: 0,
            guideLink: "../Page1/section1/index.html",
            sessionvars: {
              width1: "25",
              area1: "25",
              area2: "168",
              width2: "25",
              height: "80",
            },
          },
          {
            question:
              "كم قيراط لأرض طولها 200 متر وعرضها 18 مترًا تم القسمة على 168 متر؟",
            answers: [
              "21 قيراط",
              "21 قيراط و 10.28 سهم",
              "23 قيراط",
              "20 قيراط",
            ],
            correct: 1,
            guideLink: "../Page1/section1/index.html",
            sessionvars: {
              width1: "18",
              area1: "18",
              area2: "168",
              width2: "18",
              height: "200",
            },
          },
        ],
        dimensionChecker: [
          // الاسئلة الثانية برنامج معرفة العرض والطول المناسب

          {
            question:
              "إذا كان عرض 10 قراريط في الجهتين 12 مترًا، فما هو الطول المناسب إذا كان القيراط يساوي 175 مترًا؟",
            answers: ["145.86 متر", "140 متر", "150 متر", "160 متر"],
            correct: 0,
            guideLink: "../Page2/index.html",
            sessionvars: {
              carat_area: "175",
              carat: "10",
              carat_price: "12",
              "output-result-total-price": "145.86",
            },
          },
          {
            question:
              "إذا كان عرض 5 قراريط في الجهتين 10 مترًا، فما هو الطول المناسب إذا كان القيراط يساوي 168 مترًا؟",
            answers: ["84 متر", "85 متر", "86 متر", "87 متر"],
            correct: 0,
            guideLink: "../Page2/index.html",
            sessionvars: {
              carat_area: "168",
              carat: "5",
              carat_price: "10",
              "output-result-total-price": "84.00",
            },
          },
          {
            question:
              "إذا كان طول الأرض 150 مترًا، وكانت المساحة المطلوبة 1 قيراط (175 مترًا مربعًا)، فما هو العرض المطلوب؟",
            answers: ["1.17 متر", "1.25 متر", "1.50 متر", "2.00 متر"],
            correct: 0,
            guideLink: "../Page2/index.html",
            sessionvars: {
              carat_area: "175",
              carat: "1",
              carat_price: "150",
              "output-result-total-price": "1.17",
            },
          },
          {
            question:
              "إذا كان عرض 3 قراريط في الجهتين 15 مترًا، فما هو الطول المناسب إذا كان القيراط يساوي 175 مترًا؟",
            answers: ["52.50 متر", "53 متر", "54 متر", "55 متر"],
            correct: 0,
            guideLink: "../Page2/index.html",
            sessionvars: {
              carat_area: "175",
              carat: "3",
              carat_price: "15",
              "output-result-total-price": "52.50",
            },
          },
          {
            question:
              "إذا كان عرض 2 قيراط في الجهتين 8 مترًا، فما هو الطول المناسب إذا كان القيراط يساوي 168 مترًا؟",
            answers: ["33.60 متر", "34 متر", "35 متر", "36 متر"],
            correct: 0,
            guideLink: "../Page2/index.html",
            sessionvars: {
              carat_area: "168",
              carat: "2",
              carat_price: "8",
              "output-result-total-price": "33.60",
            },
          },
          {
            question:
              "إذا كان طول الأرض 200 مترًا، وكانت المساحة المطلوب بيعها 1 قيراط (175 مترًا مربعًا)، فما هو العرض المطلوب؟",
            answers: ["0.88 متر", "1.00 متر", "1.50 متر", "2.00 متر"],
            correct: 0,
            guideLink: "../Page2/index.html",
            sessionvars: {
              carat_area: "175",
              carat: "1",
              carat_price: "200",
              "output-result-total-price": "0.88",
            },
          },
          {
            question:
              "إذا كان طول الأرض 120 مترًا، وكانت المساحة المطلوب بيعها 1 قيراط (168 مترًا مربعًا)، فما هو العرض المطلوب؟",
            answers: ["1.40 متر", "1.50 متر", "1.75 متر", "2.00 متر"],
            correct: 0,
            guideLink: "../Page2/index.html",
            sessionvars: {
              carat_area: "168",
              carat: "1",
              carat_price: "120",
              "output-result-total-price": "1.40",
            },
          },
          {
            question:
              "إذا كان عرض الأرض 20 مترًا، وكانت المساحة المطلوب بيعها 1 قيراط (175 مترًا مربعًا)، فما هو الطول المطلوب؟",
            answers: ["8.75 متر", "9 متر", "10 متر", "11 متر"],
            correct: 0,
            guideLink: "../Page2/index.html",
            sessionvars: {
              carat_area: "175",
              carat: "1",
              carat_price: "20",
              "output-result-total-price": "8.75",
            },
          },
          {
            question:
              "إذا كان عرض 4 قراريط في الجهتين 16 مترًا، فما هو الطول المناسب إذا كان القيراط يساوي 168 مترًا؟",
            answers: ["42.00 متر", "43 متر", "44 متر", "45 متر"],
            correct: 0,
            guideLink: "../Page2/index.html",
            sessionvars: {
              carat_area: "168",
              carat: "4",
              carat_price: "16",
              "output-result-total-price": "42.00",
            },
          },
          {
            question:
              "إذا كان طول الأرض 180 مترًا، وكانت المساحة المطلوب بيعها 1 قيراط (175 مترًا مربعًا)، فما هو العرض المطلوب؟",
            answers: ["0.97 متر", "1.00 متر", "1.25 متر", "1.50 متر"],
            correct: 0,
            guideLink: "../Page2/index.html",
            sessionvars: {
              carat_area: "175",
              carat: "1",
              carat_price: "180",
              "output-result-total-price": "0.97",
            },
          },
        ],
        boundarySeparation: [
          // الاسئلة الثالثة برنامج فصل الحد بين المزارعين

          {
            question:
              "إذا كانت مساحة قطعة أرض 30 قيراطًا، وعرضها 15 مترًا، فما هو عرض 10 قراريط؟",
            answers: ["5 متر", "3 متر", "2 متر", "6 متر"],
            correct: 0,
            guideLink: "../Page3/index.html",
            sessionvars: {
              carat: "30",
              cm: "15",
              table_input_0_1: "10",
              table_input_0_2: "5",
            },
          },
          {
            question:
              "إذا كانت مساحة قطعة أرض 50 قيراطًا، وعرضها 10 مترًا، فما هو عرض 12 قيراطًا؟",
            answers: ["2.4 متر", "4 متر", "3 متر", "1.2 متر"],
            correct: 0,
            guideLink: "../Page3/index.html",
            sessionvars: {
              carat: "50",
              cm: "10",
              table_input_0_1: "12",
              table_input_0_2: "2.4",
            },
          },
          {
            question:
              "إذا كانت مساحة قطعة أرض 40 قيراطًا، وعرضها 20 مترًا، فما هو عرض 8 قراريط؟",
            answers: ["4 متر", "5 متر", "2 متر", "8 متر"],
            correct: 0,
            guideLink: "../Page3/index.html",
            sessionvars: {
              carat: "40",
              cm: "20",
              table_input_0_1: "8",
              table_input_0_2: "4",
            },
          },
          {
            question:
              "إذا كانت مساحة قطعة أرض 60 قيراطًا، وعرضها 24 مترًا، فما هو عرض 15 قيراطًا؟",
            answers: ["6 متر", "8 متر", "7 متر", "5 متر"],
            correct: 0,
            guideLink: "../Page3/index.html",
            sessionvars: {
              carat: "60",
              cm: "24",
              table_input_0_1: "15",
              table_input_0_2: "6",
            },
          },
          {
            question:
              "إذا كانت مساحة قطعة أرض 100 قيراطًا، وعرضها 25 مترًا، فما هو عرض 20 قيراطًا؟",
            answers: ["4 متر", "5 متر", "6 متر", "8 متر"],
            correct: 1,
            guideLink: "../Page3/index.html",
            sessionvars: {
              carat: "100",
              cm: "25",
              table_input_0_1: "20",
              table_input_0_2: "5",
            },
          },
        ],
        mediumBoundarySeparation: [
          // باقي اسئلة فصل الحد بين المزارعين مسائلة متوسطة
          {
            question:
              "قطعة أرض مساحتها 45 قيراطًا وعرضها 18 مترًا، إذا تم تقسيمها بين 3 إخوة، فما هو الفرق إذا استلم أحدهم 8 أمتار؟",
            answers: ["2 متر", "1 متر", "3 متر", "0.5 متر"],
            correct: 0,
            guideLink: "../Page3/index.html",
            sessionvars: {
              carat: "45",
              cm: "18",
              old_width_0: "0.690",
              old_width_1: "1",
              old_width_2: "5",
              table_input_0_1: "15",
              table_input_0_2: "6",
              table_input_0_3: "8",
              table_input_0_4: "-2",
              table_input_1_1: "15",
              table_input_1_2: "6",
              table_input_1_3: "5",
              table_input_1_4: "1",
              table_input_2_1: "15",
              table_input_2_2: "6",
              table_input_2_3: "5",
              table_input_2_4: "1",
            },
          },
          {
            question:
              "قطعة أرض مساحتها 60 قيراطًا وعرضها 24 مترًا، إذا تم تقسيمها بين 4 إخوة، فما هو الفرق إذا استلم أحدهم 7 أمتار؟",
            answers: ["1 متر", "2 متر", "3 متر", "0.5 متر"],
            correct: 0,
            guideLink: "../Page3/index.html",
            sessionvars: {
              carat: "60",
              cm: "24",
              old_width_0: "0.800",
              old_width_1: "1.2",
              old_width_2: "6",
              table_input_0_0: "0",
              table_input_0_1: "15",
              table_input_0_2: "6",
              table_input_0_3: "7",
              table_input_0_4: "-1",
              table_input_1_0: "0",
              table_input_1_1: "15",
              table_input_1_2: "6",
              table_input_1_3: "6",
              table_input_1_4: "0",
              table_input_2_0: "0",
              table_input_2_1: "15",
              table_input_2_2: "6",
              table_input_2_3: "6",
              table_input_2_4: "0",
              table_input_3_0: "0",
              table_input_3_1: "15",
              table_input_3_2: "6",
              table_input_3_3: "5",
              table_input_3_4: "1",
            },
          },
          {
            question:
              "قطعة أرض مساحتها 25 قيراطًا وعرضها 10 مترًا، إذا تم تقسيمها بين 5 إخوة، فما هو الفرق إذا استلم أحدهم 3 أمتار؟",
            answers: ["0.5 متر", "1 متر", "2 متر", "3 متر"],
            correct: 1,
            guideLink: "../Page3/index.html",
            sessionvars: {
              carat: "25",
              cm: "10",
              old_width_0: "0.400",
              old_width_1: "0.8",
              old_width_2: "3",
              table_input_0_0: "0",
              table_input_0_1: "5",
              table_input_0_2: "2",
              table_input_0_3: "3",
              table_input_0_4: "-1",
              table_input_1_0: "0",
              table_input_1_1: "5",
              table_input_1_2: "2",
              table_input_1_3: "1",
              table_input_1_4: "1",
              table_input_2_0: "0",
              table_input_2_1: "5",
              table_input_2_2: "2",
              table_input_2_3: "2",
              table_input_2_4: "0",
              table_input_3_0: "0",
              table_input_3_1: "5",
              table_input_3_2: "2",
              table_input_3_3: "2",
              table_input_3_4: "0",
              table_input_4_0: "0",
              table_input_4_1: "5",
              table_input_4_2: "2",
              table_input_4_3: "2",
              table_input_4_4: "0",
            },
          },
          {
            question:
              "قطعة أرض مساحتها 50 قيراطًا وعرضها 20 مترًا، إذا تم تقسيمها بين 5 إخوة، فما هو الفرق إذا استلم أحدهم 6 أمتار؟",
            answers: ["1 متر", "2 متر", "0.5 متر", "3 متر"],
            correct: 1,
            guideLink: "../Page3/index.html",
            sessionvars: {
              carat: "50",
              cm: "20",
              old_width_0: "1.000",
              old_width_1: "1.5",
              old_width_2: "6",
              table_input_0_0: "0",
              table_input_0_1: "10",
              table_input_0_2: "4",
              table_input_0_3: "6",
              table_input_0_4: "-2",
              table_input_1_0: "0",
              table_input_1_1: "10",
              table_input_1_2: "4",
              table_input_1_3: "2",
              table_input_1_4: "2",
              table_input_2_0: "0",
              table_input_2_1: "10",
              table_input_2_2: "4",
              table_input_2_3: "4",
              table_input_2_4: "0",
              table_input_3_0: "0",
              table_input_3_1: "10",
              table_input_3_2: "4",
              table_input_3_3: "4",
              table_input_3_4: "0",
              table_input_4_0: "0",
              table_input_4_1: "10",
              table_input_4_2: "4",
              table_input_4_3: "4",
              table_input_4_4: "0",
            },
          },
          {
            question:
              "قطعة أرض مساحتها 40 قيراطًا وعرضها 16 مترًا، إذا تم تقسيمها بين 4 إخوة، فما هو الفرق إذا استلم أحدهم 5 أمتار؟",
            answers: ["1 متر", "2 متر", "0.5 متر", "3 متر"],
            correct: 0,
            guideLink: "../Page3/index.html",
            sessionvars: {
              carat: "40",
              cm: "16",
              old_width_0: "0.800",
              old_width_1: "1.0",
              old_width_2: "5",
              table_input_0_0: "0",
              table_input_0_1: "10",
              table_input_0_2: "4",
              table_input_0_3: "5",
              table_input_0_4: "-1",
              table_input_1_0: "0",
              table_input_1_1: "10",
              table_input_1_2: "4",
              table_input_1_3: "3",
              table_input_1_4: "1",
              table_input_2_0: "0",
              table_input_2_1: "10",
              table_input_2_2: "4",
              table_input_2_3: "4",
              table_input_2_4: "0",
              table_input_3_0: "0",
              table_input_3_1: "10",
              table_input_3_2: "4",
              table_input_3_3: "4",
              table_input_3_4: "0",
              table_input_4_0: "0",
              table_input_4_1: "10",
              table_input_4_2: "4",
              table_input_4_3: "4",
              table_input_4_4: "0",
              table_input_5_0: "0",
            },
          },
        ],
        hardBoundarySeparation: [
          // باقي اسئلة فصل الحد بين المزارعين مسائلة صعبة
          {
            question:
              "قطعة أرض مساحتها 90 قيراطًا وعرضها 36 مترًا، إذا تم تقسيمها بين 6 إخوة، فما هو الفرق إذا استلم أحدهم 12 مترًا؟",
            answers: ["6 متر", "5 متر", "4 متر", "3 متر"],
            correct: 0,
            guideLink: "../Page3/index.html",
            sessionvars: {
              carat: "90",
              cm: "36",
              old_width_0: "1.200",
              old_width_1: "1.8",
              old_width_2: "6",
              table_input_0_0: "0",
              table_input_0_1: "15",
              table_input_0_2: "6",
              table_input_0_3: "12",
              table_input_0_4: "-6",
              table_input_1_0: "0",
              table_input_1_1: "15",
              table_input_1_2: "6",
              table_input_1_3: "5",
              table_input_1_4: "1",
              table_input_2_0: "0",
              table_input_2_1: "15",
              table_input_2_2: "6",
              table_input_2_3: "5",
              table_input_2_4: "1",
              table_input_3_0: "0",
              table_input_3_1: "15",
              table_input_3_2: "6",
              table_input_3_3: "5",
              table_input_3_4: "1",
              table_input_4_0: "0",
              table_input_4_1: "15",
              table_input_4_2: "6",
              table_input_4_3: "5",
              table_input_4_4: "1",
              table_input_5_0: "0",
              table_input_5_1: "15",
              table_input_5_2: "6",
              table_input_5_3: "4",
              table_input_5_4: "2",
            },
          },
          {
            question:
              "قطعة أرض مساحتها 150 قيراطًا وعرضها 50 مترًا، إذا تم تقسيمها بين 5 إخوة، فما هو الفرق إذا استلم أحدهم 18 مترًا؟",
            answers: ["8 متر", "7 متر", "6 متر", "5 متر"],
            correct: 0,
            guideLink: "../Page3/index.html",
            sessionvars: {
              carat: "150",
              cm: "50",
              old_width_0: "2.000",
              old_width_1: "3.0",
              old_width_2: "9",
              table_input_0_0: "0",
              table_input_0_1: "30",
              table_input_0_2: "10",
              table_input_0_3: "18",
              table_input_0_4: "-8",
              table_input_1_0: "0",
              table_input_1_1: "30",
              table_input_1_2: "10",
              table_input_1_3: "8",
              table_input_1_4: "2",
              table_input_2_0: "0",
              table_input_2_1: "30",
              table_input_2_2: "10",
              table_input_2_3: "8",
              table_input_2_4: "2",
              table_input_3_0: "0",
              table_input_3_1: "30",
              table_input_3_2: "10",
              table_input_3_3: "8",
              table_input_3_4: "2",
              table_input_4_0: "0",
              table_input_4_1: "30",
              table_input_4_2: "10",
              table_input_4_3: "8",
              table_input_4_4: "2",
            },
          },
          {
            question:
              "قطعة أرض مساحتها 120 قيراطًا وعرضها 48 مترًا، إذا تم تقسيمها بين 6 إخوة، فما هو الفرق إذا استلم أحدهم 15 مترًا؟",
            answers: ["7 متر", "6 متر", "5 متر", "4 متر"],
            correct: 0,
            guideLink: "../Page3/index.html",
            sessionvars: {
              carat: "120",
              cm: "48",
              old_width_0: "1.600",
              old_width_1: "2.4",
              old_width_2: "12",
              table_input_0_0: "0",
              table_input_0_1: "20",
              table_input_0_2: "8",
              table_input_0_3: "15",
              table_input_0_4: "-7",
              table_input_1_0: "0",
              table_input_1_1: "20",
              table_input_1_2: "8",
              table_input_1_3: "7",
              table_input_1_4: "1",
              table_input_2_0: "0",
              table_input_2_1: "20",
              table_input_2_2: "8",
              table_input_2_3: "7",
              table_input_2_4: "1",
              table_input_3_0: "0",
              table_input_3_1: "20",
              table_input_3_2: "8",
              table_input_3_3: "7",
              table_input_3_4: "1",
              table_input_4_0: "0",
              table_input_4_1: "20",
              table_input_4_2: "8",
              table_input_4_3: "6",
              table_input_4_4: "2",
              table_input_5_0: "0",
              table_input_5_1: "20",
              table_input_5_2: "8",
              table_input_5_3: "6",
              table_input_5_4: "2",
            },
          },
          {
            question:
              "قطعة أرض مساحتها 200 قيراطًا وعرضها 80 مترًا، إذا تم تقسيمها بين 8 إخوة، فما هو الفرق إذا استلم أحدهم 18 مترًا؟",
            answers: ["8 متر", "7 متر", "6 متر", "5 متر"],
            correct: 0,
            guideLink: "../Page3/index.html",
            sessionvars: {
              carat: "200",
              cm: "80",
              old_width_0: "2.500",
              old_width_1: "4.0",
              old_width_2: "16",
              table_input_0_0: "0",
              table_input_0_1: "25",
              table_input_0_2: "10",
              table_input_0_3: "18",
              table_input_0_4: "-8",
              table_input_1_0: "0",
              table_input_1_1: "25",
              table_input_1_2: "10",
              table_input_1_3: "9",
              table_input_1_4: "1",
              table_input_2_0: "0",
              table_input_2_1: "25",
              table_input_2_2: "10",
              table_input_2_3: "9",
              table_input_2_4: "1",
              table_input_3_0: "0",
              table_input_3_1: "25",
              table_input_3_2: "10",
              table_input_3_3: "9",
              table_input_3_4: "1",
              table_input_4_0: "0",
              table_input_4_1: "25",
              table_input_4_2: "10",
              table_input_4_3: "9",
              table_input_4_4: "1",
              table_input_5_0: "0",
              table_input_5_1: "25",
              table_input_5_2: "10",
              table_input_5_3: "9",
              table_input_5_4: "1",
              table_input_6_0: "0",
              table_input_6_1: "25",
              table_input_6_2: "10",
              table_input_6_3: "9",
              table_input_6_4: "1",
              table_input_7_0: "0",
              table_input_7_1: "25",
              table_input_7_2: "10",
              table_input_7_3: "8",
              table_input_7_4: "2",
              table_input_8_0: "",
            },
          },
          {
            question:
              "قطعة أرض مساحتها 80 قيراطًا وعرضها 40 مترًا، إذا تم تقسيمها بين 5 إخوة، فما هو الفرق إذا استلم أحدهم 14 مترًا؟",
            answers: ["6 متر", "5 متر", "4 متر", "3 متر"],
            correct: 0,
            guideLink: "../Page3/index.html",
            sessionvars: {
              carat: "80",
              cm: "40",
              old_width_0: "1.000",
              old_width_1: "2.0",
              old_width_2: "8",
              table_input_0_0: "0",
              table_input_0_1: "16",
              table_input_0_2: "8",
              table_input_0_3: "14",
              table_input_0_4: "-6",
              table_input_1_0: "0",
              table_input_1_1: "16",
              table_input_1_2: "8",
              table_input_1_3: "8",
              table_input_1_4: "0",
              table_input_2_0: "0",
              table_input_2_1: "16",
              table_input_2_2: "8",
              table_input_2_3: "8",
              table_input_2_4: "0",
              table_input_3_0: "0",
              table_input_3_1: "16",
              table_input_3_2: "8",
              table_input_3_3: "5",
              table_input_3_4: "3",
              table_input_4_0: "0",
              table_input_4_1: "16",
              table_input_4_2: "8",
              table_input_4_3: "5",
              table_input_4_4: "3",
              table_input_5_0: "",
            },
          },
        ],
        removalAndSubtraction: [
          // الاسئلة الرابع برنامج النزع و الطرح

          {
            question:
              "إذا كان يتم نزع 6 أسهم من كل قيراط، فما هو عدد القراريط المتبقية من 8 قراريط؟",
            answers: ["6 قراريط", "7 قراريط", "5 قراريط", "4 قراريط"],
            correct: 0,
            guideLink: "../Page4/index.html",
            sessionvars: { carat: 8, shares_subtract: 6 },
          },
          {
            question:
              "إذا كان يتم نزع 8 أسهم من كل قيراط، فما هو عدد القراريط المتبقية من 9 قراريط؟",
            answers: ["6 قراريط", "5 قراريط", "7 قراريط", "4 قراريط"],
            correct: 0,
            guideLink: "../Page4/index.html",
            sessionvars: { carat: 9, shares_subtract: 8 },
          },
          {
            question:
              "إذا كان يتم نزع 12 سهمًا من كل قيراط، فما هو عدد القراريط المتبقية من 6 قراريط؟",
            answers: ["3 قراريط", "4 قراريط", "2 قراريط", "1 قراريط"],
            correct: 0,
            guideLink: "../Page4/index.html",
            sessionvars: { carat: 6, shares_subtract: 12 },
          },

          {
            question:
              "إذا كان يتم نزع 4 أسهم من كل قيراط، فما هو عدد القراريط المتبقية من 10 قراريط؟",
            answers: [
              "8 قراريط و 8 اسهم",
              "8.5 قراريط",
              "8 قراريط",
              "7.5 قراريط",
            ],
            correct: 0,
            guideLink: "../Page4/index.html",
            sessionvars: { carat: 10, shares_subtract: 4 },
          },
          {
            question:
              "إذا كان يتم نزع 2 سهم من كل قيراط، فما هو عدد القراريط المتبقية من 12 قيراطًا؟",
            answers: ["11 قراريط", "10 قراريط", "9 قراريط", "8 قراريط"],
            correct: 0,
            guideLink: "../Page4/index.html",
            sessionvars: { carat: 12, shares_subtract: 2 },
          },
        ],
        hardRemovalAndSubtraction: [
          // باقي الاسئلة نزع وطرح الاراضي صعبة
          {
            question:
              "إذا كانت الأرض 24 قيراطًا و نزع 8 أسهم من كل قيراط، وتم بيع 12 قيراطًا من المتبقي، فما الصافي؟",
            answers: ["4 قراريط", "8 قراريط", "10 قراريط", "12 قراريط"],
            correct: 0,
            guideLink: "../Page4/index.html",
            sessionvars: { carat: 24, carat_sold: 12, shares_subtract: 8 },
          },
          {
            question:
              "إذا كانت الأرض 10 فدادين و12 قيراطًا و6.25 سهم و نزع 3.833 أسهم من كل قيراط، وتم بيع 6 قراريط و 6.333 اسهم من المتبقي، فكم الصافي؟",
            answers: [
              "8 فدادين و13 قيراط و17 سهم",
              "8 قراريط",
              "10 قراريط",
              "12 قراريط",
            ],
            correct: 0,
            guideLink: "../Page4/index.html",
            sessionvars: {
              carat: "12",
              carat_sold: "6",
              shares: "6.25",
              shares_sold: "6.33",
              shares_subtract: "3.833",
              acre: "10",
            },
          },
          {
            question:
              "إذا كانت الأرض 36 قيراطًا و نزع 6 أسهم من كل قيراط، وتم بيع 20 قيراطًا من المتبقي، فما الصافي؟",
            answers: ["10 قراريط", "7 قراريط", "14 قراريط", "16 قراريط"],
            correct: 1,
            guideLink: "../Page4/index.html",
            sessionvars: { carat: 36, carat_sold: 20, shares_subtract: 6 },
          },
          {
            question:
              "إذا كانت الأرض 48 قيراطًا و نزع 4 أسهم من كل قيراط، وتم بيع 30 قيراطًا من المتبقي، فما الصافي؟",
            answers: ["12 قراريط", "14 قراريط", "10 قراريط", "18 قراريط"],
            correct: 2,
            guideLink: "../Page4/index.html",
            sessionvars: { carat: 48, carat_sold: 30, shares_subtract: 4 },
          },
          {
            question:
              "إذا كانت الأرض 60 قيراطًا و نزع 10 أسهم من كل قيراط، وتم بيع 30 قيراطًا من المتبقي، فما الصافي؟",
            answers: ["10 قراريط", "12 قراريط", "5 قراريط", "18 قراريط"],
            correct: 2,
            guideLink: "../Page4/index.html",
            sessionvars: { carat: 60, carat_sold: 30, shares_subtract: 10 },
          },

          {
            question:
              "إذا كانت الأرض 20 قيراطًا و نزع 12 سهمًا من كل قيراط، وتم بيع 10 قيراطًا من المتبقي، فما الصافي؟",
            answers: ["0 قراريط", "6 قراريط", "7 قراريط", "8 قراريط"],
            correct: 0,
            guideLink: "../Page4/index.html",
            sessionvars: { carat: 20, carat_sold: 10, shares_subtract: 12 },
          },
          {
            question:
              "إذا كانت الأرض 30 قيراطًا و نزع 8 أسهم من كل قيراط، وتم بيع 16 قيراطًا من المتبقي، فما الصافي؟",
            answers: ["8 قراريط", "9 قراريط", "10 قراريط", "4 قراريط"],
            correct: 3,
            guideLink: "../Page4/index.html",
            sessionvars: { carat: 30, carat_sold: 16, shares_subtract: 8 },
          },
        ],
        inheritanceDivision: [
          // الاسئلة الخامسة تقسيم ميراث
          {
            question: "مات وترك 10 فدادين وزوجة وابن واحد، كم نصيب الابن؟",
            answers: [
              "4 فدادين",
              "5 فدادين",
              " 8 فدادين و 18 قيرايط ",
              "8 فدادين",
            ],
            correct: 2,
            guideLink: "../Page5/index.html",
            sessionvars: {
              acre: 10,
              carat_sold: 12,
              checkboxValues: "[true, true]",
              isSharesLeft: true,
              num_males: 1,
              num_wives: 1,
              shares_subtract: 8,
            },
          },
          {
            question: "مات وترك 10 فدادين وزوجة وثلاث بنات، كم نصيب الزوجة؟",
            answers: ["1.5 فدان", "2 فدان", "1 فدان", "فدان و 6 اسهم"],
            correct: 3,
            guideLink: "../Page5/index.html",
            sessionvars: {
              acre: 10,
              carat_sold: 12,
              checkboxValues: "[true, true, true, true]",
              isSharesLeft: true,
              num_wives: 1,
              num_females: 3,
              num_wives: 1,
              shares_subtract: 8,
            },
          },
          {
            question: "مات وترك 10 فدادين وزوجة وابنتين، كم نصيب البنت؟",
            answers: ["2 فدان 22 قيراط", "4 فدادين", "2.5 فدادين", "2 فدادين"],
            correct: 0,
            guideLink: "../Page5/index.html",
            sessionvars: {
              acre: 10,
              carat_sold: 12,
              checkboxValues: "[true, true, true]",
              isSharesLeft: true,
              num_wives: 1,
              num_females: 2,
              num_wives: 1,
              shares_subtract: 8,
            },
          },
          {
            question: "مات وترك 12 فدانًا وولدان، كم نصيب كل ولد؟",
            answers: ["6 فدادين", "7 فدادين", "8 فدادين", "5 فدادين"],
            correct: 0,
            guideLink: "../Page5/index.html",
            sessionvars: {
              acre: 12,
              carat_sold: 12,
              checkboxValues: "[true, true]",
              isSharesLeft: true,
              num_males: 2,
              shares_subtract: 8,
            },
          },
          {
            question: "مات وترك 16 فدانًا وولدين، كم نصيب كل ولد؟",
            answers: ["6 فدادين", "8 فدادين", "9 فدادين", "7 فدادين"],
            correct: 1,
            guideLink: "../Page5/index.html",
            sessionvars: {
              acre: 16,
              carat_sold: 12,
              checkboxValues: "[true, true]",
              isSharesLeft: true,
              num_males: 2,
              shares_subtract: 8,
            },
          },
          {
            question: "مات وترك 20 فدانًا وولدًا واحدًا، كم نصيب الولد؟",
            answers: ["20 فدانًا", "15 فدانًا", "18 فدانًا", "12 فدانًا"],
            correct: 0,
            guideLink: "../Page5/index.html",
            sessionvars: {
              acre: 20,
              carat_sold: 12,
              checkboxValues: "[true, true]",
              isSharesLeft: true,
              num_males: 1,
              shares_subtract: 8,
            },
          },
          {
            question: "مات وترك 20 فدانًا و بنت، كم نصيب البنت؟",
            answers: ["10 فدادين", "12 فدانًا", "8 فدادين", "5 فدادين"],
            correct: 0,
            guideLink: "../Page5/index.html",
            sessionvars: {
              acre: 20,
              carat_sold: 12,
              checkboxValues: "[true, true]",
              isSharesLeft: true,
              num_females: 1,
              shares_subtract: 8,
            },
          },

          {
            question: "مات وترك 30 فدانًا و1 ابن و2 بنات، كم نصيب كل بنت؟",
            answers: ["10 فدادين", "7.5 فدادين", "8 فدادين", "6 فدادين"],
            correct: 1,
            guideLink: "../Page5/index.html",
            sessionvars: {
              acre: 30,
              carat_sold: 12,
              checkboxValues: "[true, true, true, true]",
              isSharesLeft: true,
              num_males: 1,
              num_females: 2,
              shares_subtract: 8,
            },
          },

          {
            question: "مات وترك 24 فدانًا و1 ابن و3 بنات، كم نصيب الابن؟",
            answers: [
              "تسعة أفدنة و14 قيراطًا و9.60 سهم",
              "18 فدانًا",
              "20 فدانًا",
              "12 فدانًا",
            ],
            correct: 0,
            guideLink: "../Page5/index.html",
            sessionvars: {
              acre: 24,
              carat_sold: 12,
              checkboxValues: "[true, true, true, true, true]",
              isSharesLeft: true,
              num_males: 1,
              num_females: 3,
              shares_subtract: 8,
            },
          },
          {
            question: "مات وترك 50 فدانًا و2 ابن و4 بنات، كم نصيب كل ابن؟",
            answers: [
              "12.5 فدانًا",
              "25 فدانًا",
              "20 فدانًا",
              "15 فدانًا و 9 قيراط",
            ],
            correct: 0,
            guideLink: "../Page5/index.html",
            sessionvars: {
              acre: 50,
              carat_sold: 12,
              checkboxValues: "[true, true, true, true, true, true]",
              isSharesLeft: true,
              num_males: 2,
              num_females: 4,
              shares_subtract: 8,
            },
          },
          {
            question: "مات وترك 10 فدانًا و3 بنات، كم نصيب كل بنت؟",
            answers: [
              "3 فدادين",
              "فدَّانان و5 قراريط و6 أسهم",
              "4 فدادين",
              "2 فدان",
            ],
            correct: 1,
            guideLink: "../Page5/index.html",
            sessionvars: {
              acre: 10,
              carat_sold: 12,
              checkboxValues: "[true, true, true, true, true]",
              isSharesLeft: true,
              num_females: 3,
              shares_subtract: 8,
            },
          },
        ],
        landValueCalculation: [
          // الاسئلة السادسة حساب رئ الاراضي
          {
            question: "ما هي المعادلة المستخدمة لحساب تكلفة ري محصول القمح؟",
            answers: [
              "(عدد القراريط × عدد مرات الري) ÷ سعر الري للقيراط",
              "(سعر الري للقيراط × عدد القراريط) × عدد مرات الري",
              "(سعر الري للقيراط ÷ عدد القراريط) × عدد مرات الري",
              "(سعر الري للقيراط × عدد مرات الري) ÷ عدد القراريط",
            ],
            correct: 1,
            guideLink: "../Page6/help/index.html",
          },
          {
            question:
              "إذا كان لديك 10 قراريط من محصول القمح وسعر الري للقيراط الواحد هو 7 جنيهات، كم تبلغ تكلفة الري لمرة واحدة؟",
            answers: ["70 جنيه", "60 جنيه", "77 جنيه", "700 جنيه"],
            correct: 0,
            guideLink: "../Page6/index.html",
            sessionvars: {
              caratInput: "10",
              wateringCostPerCaratInput: "7",
              wateringTimesInput: "1",
            },
          },
          {
            question:
              "إذا تمت عملية الري 6 مرات، وسعر الري للقيراط الواحد هو 7 جنيهات لعدد 10 قراريط، ما التكلفة الإجمالية؟",
            answers: ["400 جنيه", "420 جنيه", "600 جنيه", "700 جنيه"],
            correct: 1,
            guideLink: "../Page6/index.html",
            sessionvars: {
              caratInput: "10",
              wateringCostPerCaratInput: "7",
              wateringTimesInput: "6",
            },
          },
          {
            question:
              "إذا كان سعر الري للقيراط الواحد 5 جنيهات وعدد القراريط 12 وتم الري 8 مرات، كم التكلفة الإجمالية؟",
            answers: ["450 جنيه", "480 جنيه", "500 جنيه", "520 جنيه"],
            correct: 1,
            guideLink: "../Page6/index.html",
            sessionvars: {
              caratInput: "12",
              wateringCostPerCaratInput: "5",
              wateringTimesInput: "8",
            },
          },

          {
            question:
              "ما هي تكلفة الري إذا كان عدد القراريط 15 وسعر الري للقيراط الواحد هو 6 جنيهات وتمت عملية الري 4 مرات؟",
            answers: ["360 جنيه", "400 جنيه", "450 جنيه", "3600 جنيه"],
            correct: 0,
            guideLink: "../Page6/index.html",
            sessionvars: {
              caratInput: "15",
              wateringCostPerCaratInput: "6",
              wateringTimesInput: "4",
            },
          },
          {
            question:
              "إذا تمت عملية الري 5 مرات وكان عدد القراريط 20 وسعر الري للقيراط هو 4 جنيهات، ما التكلفة الإجمالية؟",
            answers: ["300 جنيه", "400 جنيه", "350 جنيه", "500 جنيه"],
            correct: 1,
            guideLink: "../Page6/index.html",
            sessionvars: {
              caratInput: "20",
              wateringCostPerCaratInput: "4",
              wateringTimesInput: "5",
            },
          },
          {
            question:
              "كم تبلغ تكلفة الري لمرة واحدة إذا كان عدد القراريط 8 وسعر الري للقيراط الواحد 10 جنيهات؟",
            answers: ["80 جنيه", "70 جنيه", "90 جنيه", "100 جنيه"],
            correct: 0,
            guideLink: "../Page6/index.html",
            sessionvars: {
              caratInput: "8",
              wateringCostPerCaratInput: "10",
              wateringTimesInput: "1",
            },
          },
          {
            question:
              "إذا كان سعر الري للقيراط الواحد هو 9 جنيهات وعدد القراريط 10 وتم الري 3 مرات، ما هي التكلفة الإجمالية؟",
            answers: ["270 جنيه", "290 جنيه", "300 جنيه", "250 جنيه"],
            correct: 0,
            guideLink: "../Page6/index.html",
            sessionvars: {
              caratInput: "10",
              wateringCostPerCaratInput: "9",
              wateringTimesInput: "3",
            },
          },
          {
            question:
              "ما هي تكلفة الري إذا كان عدد القراريط 25 وسعر الري للقيراط الواحد هو 2 جنيهين وتم الري 10 مرات؟",
            answers: ["500 جنيه", "600 جنيه", "700 جنيه", "400 جنيه"],
            correct: 0,
            guideLink: "../Page6/index.html",
            sessionvars: {
              caratInput: "25",
              wateringCostPerCaratInput: "2",
              wateringTimesInput: "10",
            },
          },
          {
            question:
              "ما هي تكلفة الري إذا كان عدد القراريط 18 وسعر الري للقيراط الواحد هو 3 جنيهات وتم الري 7 مرات؟",
            answers: ["350 جنيه", "378 جنيه", "400 جنيه", "390 جنيه"],
            correct: 1,
            guideLink: "../Page6/index.html",
            sessionvars: {
              caratInput: "18",
              wateringCostPerCaratInput: "3",
              wateringTimesInput: "7",
            },
          },
        ],
        convertQasabToMeter: [
          // الاسئلة السابعة برنامج تحويل من قصبة لمتر
          {
            question: "كم يبلغ طول القصبة الواحدة بالمتر؟",
            answers: ["3.55", "4.00", "3.75", "3.30"],
            correct: 0,
            guideLink: "../Page7/section1/index.html",
            sessionvars: { input_reed: "1" },
          },
          {
            question:
              "إذا كانت المسافة 5 قصبات و23 قبضة ونصف قبضة، كم تساوي بالمتر الطولي؟",
            answers: ["21.82", "21.23", "21.88", "21.90"],
            correct: 1,
            guideLink: "../Page7/section1/index.html",
            sessionvars: {
              input_reed: "5",
              input_lessThanFist: "0.5",
              input_fist: "23",
            },
          },
          {
            question:
              "إذا كانت المسافة 7 قصبات و15 قبضة، كم تساوي بالمتر الطولي؟",
            answers: ["26.24", "27.07", "26.28", "26.25"],
            correct: 1,
            guideLink: "../Page7/section1/index.html",
            sessionvars: {
              input_reed: "7",
              input_lessThanFist: "0",
              input_fist: "15",
            },
          },
          {
            question:
              "إذا كانت المسافة 10 قصبات و8 قبضة، كم تساوي بالمتر الطولي؟",
            answers: ["36.68", "36.68", "36.70", "36.72"],
            correct: 1,
            guideLink: "../Page7/section1/index.html",
            sessionvars: {
              input_reed: "10",
              input_lessThanFist: "0",
              input_fist: "8",
            },
          },
          {
            question:
              "إذا كانت المسافة 2 قصبة و12 قبضة ونصف قبضة، كم تساوي بالمتر الطولي؟",
            answers: ["8.94", "8.95", "8.96", "8.93"],
            correct: 1,
            guideLink: "../Page7/section1/index.html",
            sessionvars: {
              input_reed: "2",
              input_lessThanFist: "0.5",
              input_fist: "12",
            },
          },
          {
            question:
              "إذا كانت المسافة 8 قصبات و7 قبضة، كم تساوي بالمتر الطولي؟",
            answers: ["29.43", "29.44", "29.42", "29.45"],
            correct: 1,
            guideLink: "../Page7/section1/index.html",
            sessionvars: {
              input_reed: "8",
              input_lessThanFist: "0",
              input_fist: "7",
            },
          },
          {
            question:
              "إذا كانت المسافة 5 قصبات و10 قبضات وثلث قبضة، كم تساوي بالمتر الطولي؟",
            answers: ["19.63", "19.28", "19.65", "19.66"],
            correct: 1,
            guideLink: "../Page7/section1/index.html",
            sessionvars: {
              input_reed: "5",
              input_lessThanFist: "0.33",
              input_fist: "10",
            },
          },
          {
            question:
              "إذا كانت المسافة 7 قصبات و20 قبضة ونصف قبضة، كم تساوي بالمتر الطولي؟",
            answers: ["27.83", "27.84", "27.88", "27.86"],
            correct: 2,
            guideLink: "../Page7/section1/index.html",
            sessionvars: {
              input_reed: "7",
              input_lessThanFist: "0.5",
              input_fist: "20",
            },
          },
          {
            question:
              "إذا كانت المسافة 8 قصبات و25 قبضة وربع قبضة، كم تساوي بالمتر الطولي؟",
            answers: ["31.52", "32.13", "31.54", "31.55"],
            correct: 1,
            guideLink: "../Page7/section1/index.html",
            sessionvars: {
              input_reed: "8",
              input_lessThanFist: "0.25",
              input_fist: "25",
            },
          },
          {
            question:
              "إذا كانت المسافة 9 قصبات و15 قبضة وثمن قبضة، كم تساوي بالمتر الطولي؟",
            answers: ["34.19", "33.31", "33.32", "33.33"],
            correct: 0,
            guideLink: "../Page7/section1/index.html",
            sessionvars: {
              input_reed: "9",
              input_lessThanFist: "0.125",
              input_fist: "15",
            },
          },
          {
            question:
              "إذا كانت المسافة 4 قصبات و18 قبضة ونصف قبضة، كم تساوي بالمتر الطولي؟",
            answers: ["16.57", "16.58", "16.94", "16.60"],
            correct: 2,
            guideLink: "../Page7/section1/index.html",
            sessionvars: {
              input_reed: "4",
              input_lessThanFist: "0.5",
              input_fist: "18",
            },
          },
          {
            question: "ما هي الطريقة الصحيحة لكتابة ثلثي قبضة او ثلثي سهم؟",
            answers: ["0.666", "0.67", "0.66", "0.33"],
            correct: 0,
            guideLink: "../Page7/section1/index.html",
            sessionvars: { input_lessThanFist: "0.666" },
          },
          {
            question: "ما هي الطريقة الصحيحة لكتابة نصف قبضة او نصف سهم؟",
            answers: ["0.5", "0.51", "0.25", "1.0"],
            correct: 0,
            guideLink: "../Page7/section1/index.html",
            sessionvars: { input_lessThanFist: "0.5" },
          },
          {
            question:
              "ما هي الطريقة الصحيحة لكتابة ثلاثة أرباع قبضة او ثلاثة ارباع سهم؟",
            answers: ["0.75", "0.70", "0.50", "1.0"],
            correct: 0,
            guideLink: "../Page7/section1/index.html",
            sessionvars: { input_lessThanFist: "0.75" },
          },

          {
            question: "ما هي الطريقة الصحيحة لكتابة ربع قبضة او ربع سهم؟",
            answers: ["0.25", "0.20", "0.50", "0.75"],
            correct: 0,
            guideLink: "../Page7/section1/index.html",
            sessionvars: { input_lessThanFist: "0.25" },
          },
          {
            question:
              "ما هي الطريقة الصحيحة لكتابة خمسة أسداس قبضة او خمس اسداس سهم؟",
            answers: ["0.833", "0.80", "0.85", "0.75"],
            correct: 0,
            guideLink: "../Page7/section1/index.html",
            sessionvars: { input_lessThanFist: "0.833" },
          },
        ],
        convertMeterToQasab: [
          // الاسئلة الثامنة تحويل من متر لقصبة
          {
            question: "كيف يمكن تحويل عدد الأمتار الطولية إلى قصبة؟",
            answers: [
              "يتم ضرب عدد الأمتار في 0.1479166667",
              "يتم تقسيم عدد الأمتار على 0.1479166667",
              "يتم ضرب عدد الأمتار في 24",
              "يتم تقسيم عدد الأمتار على 24",
            ],
            correct: 1,
            guideLink: "../Page7/section2/help/index.html",
          },

          {
            question: "ما هي الطريقة الصحيحة لكتابة 30 متر و 3 سنتيمتر؟",
            answers: ["30.03", "30.3", "3.03", "33.0"],
            correct: 0,
            guideLink: "../Page7/section2/index.html",
            sessionvars: { centimeters: "3003.00", meters: "30.03" },
          },

          {
            question:
              "إذا كانت المسافة 19 مترًا طوليًا، كم تساوي بالقصبة الطولية؟",
            answers: [
              "5 قصبة و8.45 قبضة",
              "5 قصبة و9 قبضات",
              "6 قصبة و3 قبضات",
              "4 قصبة و15 قبضة",
            ],
            correct: 0,
            guideLink: "../Page7/section2/index.html",
            sessionvars: {
              meters: "19",
              centimeters: "1900.00",
              qasab: "5.35",
              remainingQabda: "12",
            },
          },

          {
            question:
              "إذا كانت المسافة 30 مترًا طوليًا، كم تساوي بالقصبة الطولية؟",
            answers: [
              "8 قصبة و4 قبضات",
              "8 قصبة و10.82 قبضات",
              "7 قصبة و16 قبضة",
              "6 قصبة و15 قبضة",
            ],
            correct: 1,
            guideLink: "../Page7/section2/index.html",
            sessionvars: {
              meters: "30",
              centimeters: "3000.00",
              qasab: "8.45",
              remainingQabda: "10",
            },
          },
          {
            question:
              "إذا كانت المسافة 15 مترًا طوليًا، كم تساوي بالقصبة الطولية؟",
            answers: [
              "4 قصبة و5.41 قبضة",
              "4 قصبة و8 قبضات",
              "5 قصبة و1 قبضة",
              "6 قصبة و5 قبضات",
            ],
            correct: 0,
            guideLink: "../Page7/section2/index.html",
            sessionvars: {
              meters: "15",
              centimeters: "1500.00",
              qasab: "4.22",
              remainingQabda: "12",
            },
          },
          {
            question:
              "إذا كانت المسافة 45 مترًا طوليًا، كم تساوي بالقصبة الطولية؟",
            answers: [
              "12 قصبة و14 قبضة",
              "12 قصبة و16.23 قبضة",
              "13 قصبة و9 قبضات",
              "11 قصبة و19 قبضة",
            ],
            correct: 1,
            guideLink: "../Page7/section2/index.html",
            sessionvars: {
              meters: "45",
              centimeters: "4500.00",
              qasab: "12.67",
              remainingQabda: "16",
            },
          },
          {
            question:
              "إذا كانت المسافة 50 مترًا طوليًا، كم تساوي بالقصبة الطولية؟",
            answers: [
              "14 قصبة و2.03 قبضات",
              "14 قصبة و11 قبضات",
              "13 قصبة و12 قبضات",
              "15 قصبة و5 قبضات",
            ],
            correct: 0,
            guideLink: "../Page7/section2/index.html",
            sessionvars: {
              meters: "50",
              centimeters: "5000.00",
              qasab: "14.08",
              remainingQabda: "9",
            },
          },
          {
            question:
              "إذا كانت المسافة 25 مترًا طوليًا، كم تساوي بالقصبة الطولية؟",
            answers: [
              "7 قصبة و3 قبضات",
              "7 قصبة و1.01 قبضات",
              "8 قصبة و2 قبضة",
              "6 قصبة و10 قبضات",
            ],
            correct: 1,
            guideLink: "../Page7/section2/index.html",
            sessionvars: {
              meters: "25",
              centimeters: "2500.00",
              qasab: "7.04",
              remainingQabda: "5",
            },
          },
          {
            question:
              "إذا كانت المسافة 60 مترًا طوليًا، كم تساوي بالقصبة الطولية؟",
            answers: [
              "16 قصبة و21.63 قبضة",
              "17 قصبة و5 قبضات",
              "15 قصبة و20 قبضات",
              "18 قصبة و10 قبضات",
            ],
            correct: 0,
            guideLink: "../Page7/section2/index.html",
            sessionvars: {
              meters: "60",
              centimeters: "6000.00",
              qasab: "16.90",
              remainingQabda: "5",
            },
          },
          {
            question:
              "إذا كانت المسافة 40 مترًا طوليًا، كم تساوي بالقصبة الطولية؟",
            answers: [
              "11 قصبة و3 قبضات",
              "10 قصبة و12 قبضة",
              "12 قصبة و5 قبضات",
              "11 قصبة و6.42 قبضات",
            ],
            correct: 3,
            guideLink: "../Page7/section2/index.html",
            sessionvars: {
              meters: "40",
              centimeters: "4000.00",
              qasab: "11.27",
              remainingQabda: "5",
            },
          },
          {
            question:
              "إذا كانت المسافة 10 مترًا طوليًا، كم تساوي بالقصبة الطولية؟",
            answers: [
              "3 قصبة و5 قبضات",
              "2 قصبة و19.61 قبضات",
              "4 قصبة و7 قبضات",
              "2 قصبة و8 قبضات",
            ],
            correct: 1,
            guideLink: "../Page7/section2/index.html",
            sessionvars: {
              meters: "10",
              centimeters: "1000.00",
              qasab: "2.82",
              remainingQabda: "12",
            },
          },
          {
            question:
              "إذا كانت المسافة 55 مترًا طوليًا، كم تساوي بالقصبة الطولية؟",
            answers: [
              "15 قصبة و11.83 قبضات",
              "16 قصبة و5 قبضات",
              "17 قصبة و3 قبضات",
              "18 قصبة و2 قبضات",
            ],
            correct: 0,
            guideLink: "../Page7/section2/index.html",
            sessionvars: {
              meters: "55",
              centimeters: "5500.00",
              qasab: "15.49",
              remainingQabda: "10",
            },
          },
        ],
        convertKiratToMeter: [
          // الاسئلة التاسعة تحويل من قيراط الي متر
          {
            question:
              "في حالة كان القيراط 175.03458 كم تبلغ مساحة الفدان بالمتر المربع؟",
            answers: ["4200.83", "4000.00", "4300.50", "4050.25"],
            correct: 0,
            guideLink: "../Page7/section3/index.html",
            sessionvars: {
              "input-acre": "1",
              "input-carat-area-in-meter": "175.03458 ",
            },
          },

          {
            question:
              "في حالة كان القيراط 168 كم تبلغ مساحة الفدان بالمتر المربع؟",
            answers: ["4032", "4000.00", "4300.50", "4050.25"],
            correct: 0,
            guideLink: "../Page7/section3/index.html",
            sessionvars: {
              "input-acre": "1",
              "input-carat-area-in-meter": "168",
              "input-meter-price": "1",
            },
          },

          {
            question:
              "في حالة كان القيراط 175 كم تبلغ مساحة الفدان بالمتر المربع؟",
            answers: ["4200", "4000.00", "4300.50", "4050.25"],
            correct: 0,
            guideLink: "../Page7/section3/index.html",
            sessionvars: {
              "input-acre": "1",
              "input-carat-area-in-meter": "175",
            },
          },

          {
            question:
              "في حالة كان الفدان 4200.83 متر مربع كم يبلغ مساحة القيراط؟",
            answers: ["168.00", "175.3458", "180.00", "150.00"],
            correct: 1,
            guideLink: "../Page7/section3/index.html",
            sessionvars: {
              "input-acre": "1",
              "input-carat-area-in-meter": "175.03458 ",
            },
          },
          {
            question:
              "في حالة كان القيراط 175.3458 كم تبلغ مساحة السهم الواحد بالمتر المربع؟",
            answers: ["7.00", "7.293125", "6.90", "8.00"],
            correct: 1,
            guideLink: "../Page7/section3/index.html",
            sessionvars: {
              "input-shares": "1",
              "input-carat-area-in-meter": "175.03458 ",
            },
          },
          {
            question:
              "كم يساوي القيراط الواحد بالقبضات في حالة لو كان القيراط بالمتر 175 ؟",
            answers: ["336", "333", "350", "300"],
            correct: 1,
            guideLink: "../Page7/section3/index.html",
            sessionvars: {
              "input-acre": "0",
              "input-carat": "1",
              "input-carat-area-in-meter": "175",
            },
          },

          {
            question:
              "كم تبلغ مساحة الفدان بالقصبات المربعة في حالة كان بالمتر 4200؟",
            answers: ["200", "300", "420", "333 قصبة و6 قبض"],
            correct: 3,
            guideLink: "../Page7/section3/index.html",
            sessionvars: {
              "input-acre": "1",
              "input-carat-area-in-meter": "175",
            },
          },

          {
            question:
              "كم يساوي القيراط الواحد بالقصبات المربعة في حالة كان بالمتر 175؟",
            answers: [
              "13 قصبة و21 قبضة",
              "13 قصبة و23 قبضة",
              "13 قصبة و22 قبضة",
              "13 قصبة و30 قبضة",
            ],
            correct: 0,
            guideLink: "../Page7/section3/index.html",
            sessionvars: {
              "input-carat": "1",
              "input-carat-area-in-meter": "175",
              "input-meter-price": "0",
            },
          },
        ],
        convertMeterToKirat: [
          // الاسئلة العاشرة تحويل من متر الي قيراط
          {
            question:
              "إذا كانت مساحة الأرض 8400 متر مربع، وكان القيراط يعادل 175 متر مربع كم عدد الأفدنة التي تمثلها؟",
            answers: ["2 فدان", "1.5 فدان", "2.5 فدان", "2.1 فدان"],
            correct: 0,
            guideLink: "../Page7/section4/index.html",
            sessionvars: {
              acre: "2",
              carat: "0",
              caratAreaInMeter: "175",
              fist: "12",
              lessThanFist: "0.03",
              meterSquare: "8400",
              reed: "666",
              shares: "0.00",
              totalCaratPrice: "0.00",
            },
          },
          {
            question:
              "إذا كانت المساحة 6300 متر مربع، وكان القيراط يعادل 175 متر مربع كم عدد الأفدنة والقيراط؟",
            answers: [
              "1 فدان و12 قيراط",
              "1.5 فدان",
              "1 فدان و6 قيراط",
              "1 فدان و9 قيراط",
            ],
            correct: 0,
            guideLink: "../Page7/section4/index.html",
            sessionvars: {
              acre: "1",
              carat: "12",
              caratAreaInMeter: "175",
              meterSquare: "6300",
            },
          },

          {
            question:
              "إذا كانت المساحة 168 متر مربع، و كان القيراط = 168 كم عدد القراريط؟",
            answers: ["1 قيراط", "2 قيراط", "3 قيراط", "4 قيراط"],
            correct: 0,
            guideLink: "../Page7/section4/index.html",
            sessionvars: {
              carat: "1",
              caratAreaInMeter: "168",
              meterSquare: "168",
            },
          },

          {
            question:
              "إذا كانت المساحة 1000 متر مربع، كم تساوي بالقراريط والأسهم إذا كان القيراط يعادل 168 متر مربع؟",
            answers: [
              "5 قراريط و80.95 سهم",
              "5 قراريط و22.86 سهم",
              "6 قراريط و10.35 سهم",
              "5 قراريط و50.00 سهم",
            ],
            correct: 1,
            guideLink: "../Page7/section4/index.html",
            sessionvars: {
              carat: "5",
              shares: "22.86",
              caratAreaInMeter: "168",
              meterSquare: "1000",
            },
          },

          {
            question:
              "إذا كانت المساحة 1500 متر مربع، كم تساوي بالقراريط والأسهم إذا كان القيراط يعادل 175 متر مربع؟",
            answers: [
              "8 قراريط و13.71 سهم",
              "8 قراريط و60.00 سهم",
              "8 قراريط و20.57 سهم",
              "9 قراريط و15.43 سهم",
            ],
            correct: 0,
            guideLink: "../Page7/section4/index.html",
            sessionvars: {
              carat: "8",
              shares: "15.43",
              caratAreaInMeter: "175",
              meterSquare: "1500",
            },
          },
          {
            question:
              "إذا كانت المساحة 500 متر مربع، كم تساوي بالقراريط والأسهم إذا كان القيراط يعادل 168 متر مربع؟",
            answers: [
              "2 قراريط و21.43 سهم",
              "3 قراريط و10.00 سهم",
              "2 قراريط و12.86 سهم",
              "3 قراريط و0.57 سهم",
            ],
            correct: 0,
            guideLink: "../Page7/section4/index.html",
            sessionvars: {
              carat: "2",
              shares: "21.43",
              caratAreaInMeter: "168",
              meterSquare: "500",
            },
          },
          {
            question:
              "إذا كانت المساحة 875 متر مربع، كم تساوي بالقراريط والأسهم إذا كان القيراط يعادل 175 متر مربع؟",
            answers: [
              "5 قراريط و22.86 سهم",
              "4 قراريط و20.57 سهم",
              "4 قراريط و57.14 سهم",
              "5 قراريط و10.00 سهم",
            ],
            correct: 0,
            guideLink: "../Page7/section4/index.html",
            sessionvars: {
              carat: "5",
              shares: "22.86",
              caratAreaInMeter: "175",
              meterSquare: "875",
            },
          },

          {
            question:
              "إذا كانت المساحة 1200 متر مربع، كم تساوي بالقراريط والأسهم إذا كان القيراط يعادل 168 متر مربع؟",
            answers: [
              "7 قراريط و3.43 سهم",
              "7 قراريط و12.00 سهم",
              "8 قراريط و15.43 سهم",
              "7 قراريط و30.00 سهم",
            ],
            correct: 0,
            guideLink: "../Page7/section4/index.html",
            sessionvars: {
              carat: "7",
              shares: "3.43",
              caratAreaInMeter: "168",
              meterSquare: "1200",
            },
          },
          {
            question:
              "إذا كانت المساحة 2500 متر مربع، كم تساوي بالقراريط والأسهم إذا كان القيراط يعادل 175 متر مربع؟",
            answers: [
              "14 قراريط و6.86 سهم",
              "15 قراريط و30.00 سهم",
              "14 قراريط و57.14 سهم",
              "16 قراريط و2.86 سهم",
            ],
            correct: 0,
            guideLink: "../Page7/section4/index.html",
            sessionvars: {
              carat: "14",
              shares: "6.86",
              caratAreaInMeter: "175",
              meterSquare: "2500",
            },
          },

          {
            question:
              "إذا كانت المساحة 5000 متر مربع، كم تساوي بالقراريط والأسهم إذا كان القيراط يعادل 175 متر مربع؟",
            answers: [
              "فدان و 4 قراريط 13.71 سهم",
              "15 قراريط و30.00 سهم",
              "14 قراريط و57.14 سهم",
              "16 قراريط و2.86 سهم",
            ],
            correct: 0,
            guideLink: "../Page7/section4/index.html",
            sessionvars: {
              acre: "1",
              carat: "4",
              shares: "13.71",
              caratAreaInMeter: "175",
              meterSquare: "5000",
            },
          },
        ],
        generalMeasurementInfo: [
          // معلومات عامه عن القياس
          {
            question: "كم يساوي الفدان الواحد بالقيراطات؟",
            answers: ["12 قيراط", "24 قيراط", "36 قيراط", "48 قيراط"],
            correct: 1,
          }, // السؤال الأول المضاف
          {
            question: "كم يساوي القيراط الواحد بالأسهم؟",
            answers: ["12 سهم", "18 سهم", "24 سهم", "36 سهم"],
            correct: 2,
          }, // السؤال الثاني المضاف

          {
            question: "ما مساحة القيراط في أغلب مناطق مصر؟",
            answers: [
              "168 متر مربع",
              "175 متر مربع",
              "171.388 متر مربع",
              "175.3458 متر مربع",
            ],
            correct: 1,
          },
          {
            question: "كم تبلغ مساحة القبضة الواحدة بالمتر المربع؟",
            answers: ["0.140", "0.147916667", "0.150", "0.160"],
            correct: 1,
          },

          {
            question: "ما الذي يرمز إليه السهم في القيراط؟",
            answers: [
              "وحدة مساحة أصغر داخل القيراط",
              "مساحة الفدان",
              "مساحة القيراط بالكامل",
              "  القصبة ",
            ],
            correct: 0,
          },
          {
            question: "كم تبلغ مساحة القصبة المربعة بالمتر المربع؟",
            answers: [
              "12.00000 متر مربع",
              "13.00000 متر مربع",
              "12.60250 متر مربع",
              "11.50000 متر مربع",
            ],
            correct: 2,
          },
          {
            question: "ما طول ضلع القصبة المربعة بالمتر؟",
            answers: ["3.55 متر", "3.75 متر", "4.00 متر", "3.25 متر"],
            correct: 0,
          },
          {
            question: "ماذا تعني كلمة 'نزع' في سياق الأراضي الزراعية؟",
            answers: [
              "إضافة مساحة جديدة إلى الأرض",
              "خصم مساحة من الأرض لأغراض معينة",
              "تحويل المساحة من قيراط إلى فدان",
              "تقسيم الأرض إلى عدة قطع",
            ],
            correct: 1,
          },

          {
            question: "ما هو الطول الذي تمثله القصبة الطولية؟",
            answers: [
              "المسافة الطولية فقط",
              "مساحة الأرض",
              "حجم المبنى",
              "نصف قطر الدائرة",
            ],
            correct: 0,
          },
          {
            question: "ما الفرق الأساسي بين القصبة الطولية والقصبة المربعة؟",
            answers: [
              "الطولية تقيس الطول، والمربعة تقيس المساحة",
              "الطولية تقيس المساحة، والمربعة تقيس الطول",
              "الطولية تقيس الحجم، والمربعة تقيس الطول",
              "الطولية تقيس الطول والمساحة معاً",
            ],
            correct: 0,
          },
          {
            question: "كم يبلغ طول القصبة الطولية بالمتر؟",
            answers: ["2.55 متر", "3.55 متر", "4.55 متر", "5.55 متر"],
            correct: 1,
          },
          {
            question: "كم تعادل مساحة القصبة المربعة الواحدة بالمتر المربع؟",
            answers: [
              "10 متر مربع",
              "12.6025 متر مربع",
              "15 متر مربع",
              "18 متر مربع",
            ],
            correct: 1,
          },
          {
            question:
              "إذا كانت لديك قطعة أرض طولها 6 قصبات وعرضها 4 قصبات، فما مساحتها بالقصبة المربعة؟",
            answers: [
              "20 قصبة مربعة",
              "24 قصبة مربعة",
              "30 قصبة مربعة",
              "36 قصبة مربعة",
            ],
            correct: 3,
          },
          {
            question: "إذا أردت تحويل 10 متر طولي إلى قصبة وقبضة، فما الناتج؟",
            answers: [
              "2 قصبة و10 قبضة",
              "2 قصبة و19.61 قبضة",
              "3 قصبات و5 قبضة",
              "2 قصبة و22.34 قبضة",
            ],
            correct: 1,
          },
          {
            question: "كم عدد القبضات الموجودة في القصبة المربعة الواحدة؟",
            answers: [
              "144 قبضة مربعة",
              "288 قبضة مربعة",
              "576 قبضة مربعة",
              "324 قبضة مربعة",
            ],
            correct: 2,
          },
          {
            question:
              "إذا كانت لديك قطعة أرض مساحتها 50 متر مربع، كم تعادل بالقصبة المربعة؟",
            answers: [
              "3.97 قصبة مربعة",
              "4.24 قصبة مربعة",
              "3.63 قصبة مربعة",
              "3.21 قصبة مربعة",
            ],
            correct: 0,
          },
          {
            question:
              "إذا كان لديك 4 قصبات طولية على شكل مربع، كم تكون مساحتها بالقصبة المربعة؟",
            answers: [
              "12 قصبة مربعة",
              "16 قصبة مربعة",
              "20 قصبة مربعة",
              "24 قصبة مربعة",
            ],
            correct: 1,
          },
          {
            question:
              "كيف نحسب المساحة بالقصبة المربعة إذا كان لدينا الطول والعرض بالقصبة الطولية؟",
            answers: [
              "المساحة = الطول × العرض",
              "المساحة = الطول ÷ العرض",
              "المساحة = الطول × 24",
              "المساحة = العرض ÷ الطول",
            ],
            correct: 0,
          },
          {
            question:
              "إذا أردت تحويل مساحة 7 قصبات مربعة إلى متر مربع، كم الناتج؟",
            answers: [
              "84.2175 متر مربع",
              "82.215 متر مربع",
              "88.125 متر مربع",
              "90.13 متر مربع",
            ],
            correct: 0,
          },
          {
            question: "ما العلاقة بين القصبة الطولية والقصبة المربعة؟",
            answers: [
              "القصبة المربعة تمثل مربع طول ضلعه قصبة واحدة",
              "القصبة المربعة هي 24 ضعف القصبة الطولية",
              "القصبة الطولية تقيس المساحة بينما القصبة المربعة تقيس الطول",
              "القصبة المربعة تعادل نصف القصبة الطولية",
            ],
            correct: 0,
          },
        ],
      };