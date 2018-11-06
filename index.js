const axios = require('axios')
const fs = require('fs')

const getData = async address => {
  try {
    const { data } = await axios.get(address)
    return data
  } catch (error) {
    console.error(error)
  }
}

// Function removes brackets and what is inside of them from title
const filmClean = filmName => {
  const bracket =
    filmName.indexOf(' [') > 0 ? filmName.indexOf(' [') : filmName.length
  return filmName.substring(0, bracket).trim()
}

const budgetClean = budgetData => {
  //set budget to undefined if there's no data
  if (!budgetData) {
    return budgetData
  }
  if (budgetData.indexOf(' [') > 0) {
    //gets rid of bracket info
    budgetData = budgetData.substring(0, budgetData.indexOf(' [')).trim()
  }
  if (budgetData.indexOf(' (') > 0) {
    //gets rid of parathesis info
    budgetData = budgetData.substring(0, budgetData.indexOf(' (')).trim()
  }
  if (budgetData.includes('US') > 0) {
    //getting rid of US in front of dollar sign
    budgetData = budgetData.substring(2).trim()
  }

  return budgetData
}

const budgetConvert = (year, rawBudget) => {
  //Assumption if two numbers are given in different currency, first number taken
  let currencyConversion = 1 //default currency is USD
  let factor = 1 //default value is not in millions
  const inflation = 1.02 //assumed 2% inflation rate
  const years = 2018 - year //brining to 2018 dollars based on assumed inflation
  const totalInflation = Math.pow(inflation, years)
  if (rawBudget === undefined) {
    return rawBudget
  }
  if (rawBudget[0] === '£') {
    currencyConversion = 1.3 //current pound to USD
  } else if (rawBudget[0] === '€') {
    currencyConversion = 1.14 // idn't see any € but going to add this in case
  }
  if (rawBudget.includes('million')) {
    factor = 1000000
  }
  //now need to parse for the numbers
  if (rawBudget.includes('million')) {
    rawBudget = rawBudget.substring(1, rawBudget.indexOf('m')).trim()
    if (rawBudget.includes('-')) {
      //accounts for ranges, will find the average for ranges
      let range = rawBudget.split('-')
      rawBudget = ((range[0] * 1.0 + range[1] * 1.0) / 2.0).toString()
    } else if (rawBudget.includes('–')) {
      let range = rawBudget.split('–') //different symbol for godfather?
      rawBudget = ((range[0] * 1.0 + range[1] * 1.0) / 2.0).toString()
    }
  } else {
    rawBudget = parseFloat(
      rawBudget
        .substring(1)
        .trim()
        .replace(/,/g, '')
    ) //removes commas
  }
  return {
    year,
    rawBudget,
    currencyConversion,
    factor,
    totalInflation,
    finalBudget: rawBudget * currencyConversion * factor * totalInflation,
    finalBudgetNoInflation: rawBudget * currencyConversion * factor,
  }
}

//options for currency formatting for output
const opts = '{style: "decimal", currency: "USD", minimumFractionDigits: 2}'

const writeData = data => {
  const writeStream = fs.createWriteStream('oscarResults.json')
  writeStream.write(data, 'utf8')
  writeStream.on('finish', () => {
    console.log('Data done!')
  })
  writeStream.end()
}

const oscarResults = async () => {
  const initialData = await getData('http://oscars.yipitdata.com')
  let sumBudgetInflation = 0
  let sumBudgetNoInflation = 0
  let countWithoutNull = 0
  //filtering data for winners and creating an object for each year
  const oscarWinners = await Promise.all(
    initialData.results.map(async yearlyData => {
      const winner = yearlyData.films.filter(year => year.Winner)
      //creating formated object for winner
      const winnerOutput = {}
      // Year is only the first 4 characters in input dataset
      winnerOutput.year = yearlyData.year.substring(0, 4)
      winnerOutput.film = filmClean(winner[0].Film)

      //Dealing with budget
      const additionalInfo = await getData(winner[0]['Detail URL'])
      winnerOutput.rawBudget = budgetClean(additionalInfo.Budget)
      //debugging if we need to write to output dataset
      // winnerOutput.convertedData = budgetConvert(
      //   winnerOutput.year,
      //   winnerOutput.rawBudget
      // )
      const convertedData = budgetConvert(
        winnerOutput.year,
        winnerOutput.rawBudget
      )
      if (winnerOutput.rawBudget) {
        countWithoutNull++
        sumBudgetInflation = sumBudgetInflation + convertedData.finalBudget
        sumBudgetNoInflation =
          sumBudgetNoInflation + convertedData.finalBudgetNoInflation
        winnerOutput.budgetInflation =
          '$' + convertedData.finalBudget.toLocaleString('en-US', opts)
        winnerOutput.budgetNoInflation =
          '$' +
          convertedData.finalBudgetNoInflation.toLocaleString('en-US', opts)
      }
      //writing inflation and non inflation to final dataset

      return winnerOutput
    })
  )
  await console.log('Output dataset', oscarWinners)
  await console.log('Total with budget info', countWithoutNull)
  await console.log(
    'Avg budget with Inflation',
    '$' + (sumBudgetInflation / countWithoutNull).toLocaleString('en-US', opts)
  )
  await console.log(
    'Avg budget with No Inflation',
    '$' +
      (sumBudgetNoInflation / countWithoutNull).toLocaleString('en-US', opts)
  )

  writeData(JSON.stringify(oscarWinners))
}

oscarResults()
