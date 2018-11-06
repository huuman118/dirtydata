Objective:
For given API (http://oscars.yipitdata.com)

1. Print Year-Title-Budget combination for all winners
2. Print Average Budget for all winners (Assuming to print to console)

Approach:

1. Get initial dataset from API
2. Extract winner and create new array of objects with Year, Title, and Budget
   a. Year clean up data (first 4 characters repreent year)
   b. Clean film name up to exclude brackets at the end
   c. Make GET request to get detail URL info for budget
   1. If missing, will be undefined
   2. Take out extra [], (), and leading US in data
   3. Save infromation as raw Budget
   4. Convert raw budget to US and account for inflation (gives options for both)
      -assume 2% annual inflation rate to 2018 dollars
      -assumed conversation of £ to $ of 1.3
      -account for those that are listed in millions
      -if range is provided, find average for range
      -push object into final array to console and .json file
      -Print Average with inflation and without to console. Exclude movies with no budget data from average

Setup Instructions:

1. Type "npm install"
2. Type "npm run start"

Average budget:
Total with budget info 82
Avg budget with Inflation $29,336,682.19 in 2018 dollars
Avg budget with No Inflation $17,243,245.85
