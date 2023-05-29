import { Service, Action, Event, Method } from 'moleculer';
import { v4 as uuidv4 } from 'uuid';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

class TodoActor extends Service {
  private todos: Record<string, Todo> = {};

  @Action()
  async create(ctx: any) {
    const id = uuidv4();
    const todo: Todo = {
      id,
      title: ctx.params.title,
      completed: false,
    };
    this.todos[id] = todo;

    this.broker.emit('todo.created', todo);
    return todo;
  }

  @Action()
  async update(ctx: any) {
    const { id, title, completed } = ctx.params;
    if (!this.todos[id]) {
      throw new Error('Todo not found');
    }

    const updatedTodo: Todo = { ...this.todos[id], title, completed };
    this.todos[id] = updatedTodo;

    this.broker.emit('todo.updated', updatedTodo);
    return updatedTodo;
  }

  @Action()
  async delete(ctx: any) {
    const { id } = ctx.params;
    if (!this.todos[id]) {
      throw new Error('Todo not found');
    }

    const deletedTodo = this.todos[id];
    delete this.todos[id];

    this.broker.emit('todo.deleted', deletedTodo);
    return deletedTodo;
  }

  @Action()
  async list() {
    return Object.values(this.todos);
  }

  @Event()
  onTodoCreated(todo: Todo) {
    // Handle todo creation event, e.g., perform some stream processing
  }

  @Event()
  onTodoUpdated(todo: Todo) {
    // Handle todo update event, e.g., perform some stream processing
  }

  @Event()
  onTodoDeleted(todo: Todo) {
    // Handle todo deletion event, e.g., perform some stream processing
  }
}

export default TodoActor;
