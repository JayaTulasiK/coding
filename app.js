const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const format = require('date-fns/format')
const isMatch = require('date-fns/isMatch')
var isValid = require('date-fns/isValid')
const app = express()
app.use(express.json())

let database

const intializeDbAndServer = async () => {
  try {
    database = await open({
      filename: path.json(__dirname, 'todoApplication.db'),
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running on http://localhost:3000/')
    })
  } catch (e) {
    console.log(`Database error is ${e.message}`)
    process.exit(1)
  }
}
intializeDbAndServer()

const hasPriorityAndstatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}
const hasPriorityProperties = requestQuery => {
  return requestQuery.priority !== undefined
}
const hasStatusProperties = requestQuery => {
  return requestQuery.status !== undefined
}
const hasCategoryAndStatus = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}
const hasCategoryAndPriority = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}

const hasSearchProperties = requestQuery => {
  return requestQuery.search_q !== undefined
}
const hascatogoryProperty = requestQuery => {
  return requestQuery.category !== undefined
}

const outputResult = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    category: dbObject.category,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  }
}

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodoQuery = ''
  const {search_q = '', priority, status, category} = request.query

  switch (true) {
    case hasPriorityAndstatusProperties(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodoQuery = `
        SELECT * FROM todo WHERE status ='${status} AND priority ='${priority}`
          data = await database.all(getTodoQuery)
          response.send(
            data.map(eachItem => {
              outputResult(eachItem)
            }),
          )
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasCategoryAndStatus(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LERANING'
      ) {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodoQuery = `SELECT * FROM todo WHERE 
        category ='${category}'AND status='${status}';`
          data = await database.all(getTodoQuery)
          response.send(data.map(eachItem => outputResult(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case hasCategoryAndPriority(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          priority === 'HIGH' ||
          priority === 'MEDIUM' ||
          priority === 'LOW'
        ) {
          getTodoQuery = `
        select * from todo where category ='${category}' and priority='${priority}';`
          data = await database.all(getTodoQuery)
          response.send(data.map(eachItem => outputResult(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case hasPriorityProperties(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        getTodoQuery = `
      SELECT * FROM todo WHERE priority='${priority};'`
        data = await database.all(getTodoQuery)
        response.send(data.map(eachItem => outputResult(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasStatusProperties(request.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        getTodoQuery = `
        SELECT * FROM todo WHERE status ='${status}';`

        data = await database.all(getTodoQuery)
        response.send(data.map(eachItem => outputResult(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo status')
      }
      break
    // search property

    case hasSearchProperties(request.query):
      getTodoQuery = `select * from todo where todo like '%${search_q}%';`
      data = await database.all(getTodoQuery)
      response.send(data.map(eachItem => outputResult(eachItem)))
      break

    case hascatogoryProperty(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        getTodoQuery = `select * from todo where category ='${category}';`
        data = await database.all(getTodoQuery)
        response.send(data.map(eachItem => outputResult(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    default:
      getTodoQuery = `select * from todo`

      data = await database.all(getTodoQuery)
      response.send(data.map(eachItem => outputResult(eachItem)))
  }
})

app.get('/todos/:todoId/', async (request, response) => {
  const {date} = request.query
  console.log(isMatch(date, 'yyyy-MM-dd'))

  if (isMatch(date, 'yyyy-MM-dd')) {
    const newDate = format(new Date(date), 'yyyy-MM-dd')
    console.log(newDate)
    const requestQuery = `select * from todo where due_date='${newDate}';`
    const responseResult = await database.all(requestQuery)
    response.send(responseResult.map(eachItem => outputResult(eachItem)))
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body

  if (priority === 'HIGH' || priority === 'LOW' || priority === 'MEDIUM') {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (isMatch(dueDate, 'yyyy-MM-dd')) {
          const postNewDueDate = format(new Date(dueDate), 'yyyy-MM-dd')

          const postTodoQuery = `
              INSERT INTO 
              todo (id,todo,category,priority,status,due_date)
              VALUES
              (${id},'${todo}','${category}','${status}','${postNewDueDate}');
              `
          await database.run(postTodoQuery)
          response.send('Todo Successfully Added')
        } else {
          response.status(400)
          response.send('Invalid Due Date')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo category')
      }
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updateColumn = ''
  const requestBody = request.body

  console.log(requestBody)
  const previousTodoQuery = `SELECT * FROM todo WHERE id=${todoId}`
  const previousTodo = await database.get(previousTodoQuery)

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body

  let updateTodoQuery
  switch (true) {
    case requestBody.status !== undefined:
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        updateTodoQuery = `
      UPDATE todo SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',
      due_date='${dueDate}',WHERE id =${todoId};`

        await database.run(updateTodoQuery)
        response.send('Status Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case requestBody.priority !== undefined:
      if (priority === 'HIGH' || priority === 'LOW' || priority === 'MEDIUM') {
        updateTodoQuery = `
      UPDATE todo SET todo='${todo}',priority='${priority}',status='${status}', category='${category}',
      due_date='${dueDate}' WHERE id=${todoId}`

        await database.run(updateTodoQuery)
        response.send('Priority Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case requestBody.todo !== undefined:
      updateTodoQuery = `
    UPDATE todo SET todo='${todo}, priority='${priority}',status='${status}', category='${category}',
      due_date='${dueDate}' WHERE id=${todoId}`
      await database.run(updateTodoQuery)
      response.send('Todo Updated')
      break

    case requestBody.category !== undefined:
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        updateTodoQuery = `
      UPDATE todo SET todo='${todo}, priority='${priority}',status='${status}', category='${category}',
      due_date='${dueDate}' WHERE id=${todoId}`

        await database.run(updateTodoQuery)
        response.send('Category Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, 'yyyy-MM-dd')) {
        const newDueDate = format(new Date(dueDate), 'yyyy-MM-dd')
        updateTodoQuery = `
         UPDATE todo SET todo='${todo}, priority='${priority}',status='${status}', category='${category}',
      due_date='${dueDate}' WHERE id=${todoId}`
        await database.run(updateTodoQuery)
        response.send('Due Date Updated')
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
      break
  }
})
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `
  DELETE FROM todo WHERE id=${todoId};`
  await database.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
