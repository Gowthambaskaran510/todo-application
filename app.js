const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const outputResult = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    category: dbObject.category,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (
        (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") &&
        (status === "TO DO" || status === "IN PROGRESS" || status === "DONE")
      ) {
        getTodosQuery = `
          SELECT
            *
          FROM
            todo 
          WHERE
            status = '${status}'
            AND priority = '${priority}';`;

        data = await database.all(getTodosQuery);
        response.send(data.map((eachItem) => outputResult(eachItem)));
      } else {
        response.status(400).send("Invalid Todo Status or Priority");
      }
      break;

    case hasCategoryAndStatus(request.query):
      if (
        (category === "WORK" ||
          category === "HOME" ||
          category === "LEARNING") &&
        (status === "TO DO" || status === "IN PROGRESS" || status === "DONE")
      ) {
        getTodosQuery = `
          SELECT
            *
          FROM
            todo 
          WHERE
            status = '${status}'
            AND category = '${category}';`;

        data = await database.all(getTodosQuery);
        response.send(data.map((eachItem) => outputResult(eachItem)));
      } else {
        response.status(400).send("Invalid Todo Category or Status");
      }
      break;

    case hasCategoryAndPriority(request.query):
      if (
        (category === "WORK" ||
          category === "HOME" ||
          category === "LEARNING") &&
        (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW")
      ) {
        getTodosQuery = `
          SELECT
            *
          FROM
            todo 
          WHERE
            category = '${category}'
            AND priority = '${priority}';`;

        data = await database.all(getTodosQuery);
        response.send(data.map((eachItem) => outputResult(eachItem)));
      } else {
        response.status(400).send("Invalid Todo Category or Priority");
      }
      break;

    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `
          SELECT
            *
          FROM
            todo 
          WHERE
            priority = '${priority}';`;

        data = await database.all(getTodosQuery);
        response.send(data.map((eachItem) => outputResult(eachItem)));
      } else {
        response.status(400).send("Invalid Todo Priority");
      }
      break;

    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `
          SELECT
            *
          FROM
            todo 
          WHERE
            status = '${status}';`;

        data = await database.all(getTodosQuery);
        response.send(data.map((eachItem) => outputResult(eachItem)));
      } else {
        response.status(400).send("Invalid Todo Status");
      }
      break;

    case hasSearchProperty(request.query):
      getTodosQuery = `
        SELECT
          *
        FROM
          todo 
        WHERE
          todo LIKE '%${search_q}%';`;

      data = await database.all(getTodosQuery);
      response.send(data.map((eachItem) => outputResult(eachItem)));
      break;

    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosQuery = `
          SELECT
            *
          FROM
            todo 
          WHERE
            category = '${category}';`;

        data = await database.all(getTodosQuery);
        response.send(data.map((eachItem) => outputResult(eachItem)));
      } else {
        response.status(400).send("Invalid Todo Category");
      }
      break;

    default:
      getTodosQuery = `
        SELECT
          *
        FROM
          todo;`;

      data = await database.all(getTodosQuery);
      response.send(data.map((eachItem) => outputResult(eachItem)));
      break;
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todo = await database.get(getTodoQuery);
  response.send(outputResult(todo));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  console.log(isMatch(date, "yyyy-MM-dd"));

  if (isMatch(date, "yyyy-MM-dd")) {
    const newData = format(new Date(date), "yyyy-MM-dd");

    console.log(newData);

    const requestQuery = `
            SELECT    * 
            
            FROM  todo
            
            WHERE 
             
             due_date = "${newDate}";`;

    const requestResult = await database.all(requestQuery);
    response.send(requestResult.map((eachItem) => outputResult(eachItem)));
  } else {
    response.status(400).send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isValid(new Date(dueDate))) {
          const formattedDueDate = format(new Date(dueDate), "yyyy-MM-dd");

          const postTodoQuery = `
            INSERT INTO
              todo (id, todo, priority, status, category, due_date)
            VALUES
              (${id}, '${todo}', '${priority}', '${status}', '${category}', '${formattedDueDate}');`;

          await database.run(postTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400).send("Invalid Due Date");
        }
      } else {
        response.status(400).send("Invalid Todo Category");
      }
    } else {
      response.status(400).send("Invalid Todo Status");
    }
  } else {
    response.status(400).send("Invalid Todo Priority");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;

  console.log(requestBody);

  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = requestBody;

  let updateTodoQuery;
  let updateColumn = "";

  if (requestBody.status !== undefined) {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      updateColumn = "Status";
    } else {
      response.status(400).send("Invalid Todo Status");
      return;
    }
  }

  if (requestBody.priority !== undefined) {
    if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
      updateColumn = "Priority";
    } else {
      response.status(400).send("Invalid Todo Priority");
      return;
    }
  }

  if (requestBody.todo !== undefined) {
    updateColumn = "Todo";
  }

  if (requestBody.category !== undefined) {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
      updateColumn = "Category";
    } else {
      response.status(400).send("Invalid Todo Category");
      return;
    }
  }

  if (requestBody.dueDate !== undefined) {
    if (isMatch(dueDate, "yyyy-MM-dd")) {
      const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
      updateColumn = "Due Date";
    } else {
      response.status(400).send("Invalid Due Date");
      return;
    }
  }

  if (updateColumn === "") {
    response.status(400).send("No valid update parameters found");
    return;
  }

  updateTodoQuery = `
    UPDATE
    todo
    SET
    todo = '${todo}',
    priority = '${priority}',
    status = '${status}',
    category = '${category}',
    due_date = '${dueDate}'
    WHERE
    id = ${todoId};`;

  try {
    await database.run(updateTodoQuery);
    response.send(`${updateColumn} Updated`);
  } catch (error) {
    console.error(error);
    response.status(500).send("Internal Server Error");
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM
      todo
    WHERE
      id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
