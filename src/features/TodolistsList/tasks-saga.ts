import {call, put, takeEvery} from "redux-saga/effects";
import {
    GetTasksResponse,
    ResponseType,
    TaskType,
    todolistsAPI
} from "../../api/todolists-api";
import {setAppStatusAC} from "../../app/app-reducer";
import {AxiosResponse} from "axios";
import {
    addTaskAC,
    removeTaskAC,
    setTasksAC,
} from "./tasks-reducer";
import {handleServerAppError, handleServerNetworkError} from "../../utils/error-utils";

export function* fetchTasksWorkerSaga(action: ReturnType<typeof fetchTasks>) {
    yield put(setAppStatusAC('loading'))
    const res: AxiosResponse<GetTasksResponse> = yield call(todolistsAPI.getTasks, action.todolistId)
    const tasks = res.data.items
    yield put(setTasksAC(tasks, action.todolistId))
    yield put(setAppStatusAC('succeeded'))
}

export function* removeTaskWorkerSaga(action: ReturnType<typeof removeTask>) {
    yield call(todolistsAPI.deleteTask, action.todolistId, action.taskId)
    yield put(removeTaskAC(action.taskId, action.todolistId))
}

export function* addTaskWorkerSaga(action: ReturnType<typeof addTask>) {
    yield put(setAppStatusAC('loading'))
    const res: AxiosResponse<ResponseType<{ item: TaskType }>> = yield call(todolistsAPI.createTask, action.todolistId, action.title)
    try {
        if (res.data.resultCode === 0) {
            const task = res.data.data.item
            const action = addTaskAC(task)
            yield put(action)
            yield put(setAppStatusAC('succeeded'))
        } else {
            handleServerAppError(res.data, yield put);
        }
    } catch (error) {
        handleServerNetworkError(error, yield put)
    }
}

//actions
export const addTask = (title: string, todolistId: string) => ({
    type: 'TASKS/ADD-TASKS',
    title, todolistId
})
export const fetchTasks = (todolistId: string) => ({
    type: 'TASKS/FETCH-TASKS',
    todolistId
})
export const removeTask = (taskId: string, todolistId: string) => ({
    type: 'TASKS/REMOVE-TASK',
    todolistId,
    taskId
})

export function* tasksWatcherSaga() {
    yield takeEvery('TASKS/FETCH-TASKS', fetchTasksWorkerSaga)
    yield takeEvery('TASKS/REMOVE-TASK', removeTaskWorkerSaga)
    yield takeEvery('TASKS/ADD-TASKS', addTaskWorkerSaga)
}