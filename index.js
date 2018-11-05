const axios = require('axios')

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

const oscarResults = async () => {
  const initialData = await getData('http://oscars.yipitdata.com')
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
      return winnerOutput
    })
  )
  const budget = oscarWinners.map(el => {
    return el.rawBudget
  })
  console.log(budget)
  return oscarWinners
}

oscarResults()
