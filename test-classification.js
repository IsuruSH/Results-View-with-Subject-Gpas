import { isCoreCourse, getCourseClassification } from './src/data/courseClassifications.js';

console.log("MAT313β (BCS):", getCourseClassification("MAT313β", "bcs"));
console.log("MAT313β (BSC):", getCourseClassification("MAT313β", "bsc"));
console.log("Is Core MAT313β (BCS):", isCoreCourse("MAT313β", "bcs"));
console.log("Is Core MAT313β (BSC):", isCoreCourse("MAT313β", "bsc"));
