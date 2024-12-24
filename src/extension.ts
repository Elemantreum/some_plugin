import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as path from 'path';  // Для работы с путями файлов

// Функция для получения памяти, использованной процессом с указанным именем файла
function getProcessMemoryUsage(processName: string, callback: (memory: string) => void) {
    // Ищем процесс в tasklist по имени
    child_process.exec(`tasklist | findstr "${processName}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Ошибка при получении данных: ${stderr}`);
            return;
        }

        

        // Разбираем вывод команды tasklist, чтобы извлечь память для процесса
        const processes = stdout.split(' \r\n');  // Разделяем вывод на строки
        let totalMemory = 0;

        processes.forEach(process => {
            if (process.includes(processName)) {
                const parts = process.split(/\s+/);  // Разделяем строку на части
                const memory = parts[4];  // Память в килобайтах (5-й столбец)
                totalMemory += parseInt(memory); // Суммируем память для всех процессов с таким именем
            }
        });

        // Переводим память в мегабайты и отправляем результат в колбэк
        const memoryInMB = (totalMemory / 1024).toFixed(2);
        callback(memoryInMB); // Отправляем итоговую память для этого процесса
    });
}

// Функция для получения только имени исполняемого файла из текущей отладочной сессии
function getDebugProcessName(callback: (processName: string) => void) {
    const debugSession = vscode.debug.activeDebugSession;
    if (debugSession) {
        const programName = debugSession.configuration.program;
        if (programName) {
            // Извлекаем только имя файла из полного пути
            const fileName = path.basename(programName);
            callback(fileName);
        } else {
            console.error("Не удалось получить имя программы из конфигурации отладки.");
        }
    } else {
        console.error("Нет активной отладочной сессии.");
    }
}

// Функция для обновления статусбара с информацией о памяти
function updateStatusBar() {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = 'Debug Process Memory: Loading...';
    statusBarItem.show();

    setInterval(() => {
        getDebugProcessName((processName) => {
            getProcessMemoryUsage(processName, (memoryInMB) => {
                // Обновляем текст в статусбаре с информацией о памяти
                statusBarItem.text = `Debug Process Memory: ${memoryInMB} MB`;
            });
        });
    }, 2000); // Обновление каждые 2 секунды
}

// Функция активации расширения
export function activate(context: vscode.ExtensionContext) {
    // Запуск обновления статусбара
    updateStatusBar();
}

// Функция деактивации расширения
export function deactivate() {}
