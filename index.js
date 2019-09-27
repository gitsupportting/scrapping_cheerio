/**
* Example of web page scraping with related pages
* related pages are loaded sequentially, which is slow
* but does not tax the connection.
* this example requires a few modules, so do:
* npm install request cheerio bluebird
* then node cheerio.js to run
* scraped site will be saved to a file 'flat6labs.csv'
**/
var request = require('request');
var cheerio = require('cheerio');
var Promise = require('bluebird');
var fs = require('fs');

/**
* Writes a file to the hard disk
**/
const writeFile = (name,data) => new Promise((resolve,reject)=>
  { fs.writeFile(name,data,(err)=>
    { if(err){return reject(err)}
    ; return resolve(data)
    })
  })

/**
* Gets any webpage and feeds it to cheerio,
* which is a webpage scraper
* (equivalent to jQuery, but works on the command line)
**/
const get = (url) => new Promise((resolve,reject)=>
  { console.log(`getting ${url}...`)
  ; request
      ( url
      , (error,response,html)=>
        { console.log(`...${url} got`)
        ; if(error)
          { return reject(error)
          }
          try
          { const $ = cheerio.load(html)
          ; return resolve($)
          }
          catch(e)
          { return reject(e)
          }
        }
      )
  })

/**
* Parses the urls from a company page on flat6labs
**/
const getPage = (url) => get(url)
  .then(
    ($)=>
    { const urls = []
    ; const title = $('.middle h2').html()
    ; $('.company-social a').each((i,elem)=>
        { const anchor = $(elem)
        ; const href = anchor.attr('href')
        ; urls.push(href)
        })
    ; const site =
      { title
      , urls
      }
    ; return site
    }
  ).catch(
    e=>{throw e}
  )

/**
* Get the main page from  flat6labs and parses all the companies there
**/
const getSite = (url) => get(url)
  .then(($)=>
    { console.log("1");
        const sites = []
    ; const urls = []
    ; $('.companies li a').each((i,elem)=>
      { const anchor = $(elem)
      ; const href = anchor.attr('href')
      ; const index = urls.indexOf(href)
      ; if(index<0)
       { urls.push(href)
       }
      })
    ; return Promise.each(urls,(href)=>
        getPage(href)
          .then((site)=>
            { sites.push(site)
            })
          .catch(e=>
            { console.error(`error getting ${href}`)
            ; console.error(e)
            })
          ).then(()=>
           { return sites
           })
    })
    .then((sites)=>
      { return sites.map(
          ({title,urls})=>(`${title},${urls.join(',')}`)
        ).join('\n')
      })
    .then(text=>writeFile('flat6labs.csv',text))
    .then(()=>console.log('done'))
    .catch(e=>{throw e})


/**
* Starts the whole process
**/
getSite('http://www.flat6labs.com/companies/')