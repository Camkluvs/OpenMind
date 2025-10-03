// ================================
// SISTEMA DE CONSOLA OPM CON CONTROL DE VERSIONES
// ================================

// Variables globales
let currentBranch = null;
let consoleHistory = [];
let historyIndex = -1;

// ================================
// ESTRUCTURA DE BASE DE DATOS
// ================================

/*
SQL NECESARIO PARA IMPLEMENTAR:

-- 1. Modificar tabla repositories para agregar código de clonación
ALTER TABLE repositories 
ADD COLUMN clone_code VARCHAR(8) UNIQUE;

-- 2. Crear tabla branches
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    branch_name VARCHAR(100) NOT NULL,
    is_main BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    UNIQUE(repository_id, branch_name)
);

-- 3. Modificar tabla project_files para agregar branch_id
ALTER TABLE project_files 
ADD COLUMN branch_id UUID REFERENCES branches(id);

-- 4. Crear índices para mejor rendimiento
CREATE INDEX idx_branches_repo ON branches(repository_id);
CREATE INDEX idx_files_branch ON project_files(branch_id);
CREATE INDEX idx_repos_clone_code ON repositories(clone_code);

-- 5. Función para generar códigos únicos de clonación
CREATE OR REPLACE FUNCTION generate_clone_code()
RETURNS VARCHAR(8) AS $$
DECLARE
    chars VARCHAR(62) := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    result VARCHAR(8) := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * 62 + 1)::INTEGER, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para auto-generar clone_code
CREATE OR REPLACE FUNCTION set_clone_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.clone_code IS NULL THEN
        NEW.clone_code := generate_clone_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_clone_code
BEFORE INSERT ON repositories
FOR EACH ROW
EXECUTE FUNCTION set_clone_code();

-- 7. Función para crear rama main automáticamente
CREATE OR REPLACE FUNCTION create_main_branch()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO branches (repository_id, branch_name, is_main, created_by)
    VALUES (NEW.id, 'main', TRUE, NEW.created_by);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_main_branch
AFTER INSERT ON repositories
FOR EACH ROW
EXECUTE FUNCTION create_main_branch();
*/

// ================================
// CLASE PRINCIPAL DE LA CONSOLA
// ================================

class OPMConsole {
    constructor(supabase, currentUser, currentProject) {
        this.supabase = supabase;
        this.currentUser = currentUser;
        this.currentProject = currentProject;
        this.currentRepository = null;
        this.currentBranch = null;
        this.commands = this.initializeCommands();
    }

    initializeCommands() {
        return {
            'clone': this.cloneRepository.bind(this),
            'delete': this.handleDelete.bind(this),
            'create': this.handleCreate.bind(this),
            'switch': this.switchBranch.bind(this),
            'merge': this.mergeBranch.bind(this),
            'list': this.listBranches.bind(this),
            'current': this.showCurrent.bind(this),
            'help': this.showHelp.bind(this),
            'clear': this.clearConsole.bind(this)
        };
    }

    // ================================
    // COMANDO: opm clone <código>
    // ================================
    async cloneRepository(args) {
        if (!args[0]) {
            return { success: false, message: 'Error: Debes proporcionar un código de clonación\nUso: opm clone <código>' };
        }

        const cloneCode = args[0].toUpperCase();

        try {
            // 1. Buscar repositorio por código
            const { data: sourceRepo, error: repoError } = await this.supabase
                .from('repositories')
                .select('*')
                .eq('clone_code', cloneCode)
                .single();

            if (repoError || !sourceRepo) {
                return { success: false, message: `Error: No se encontró repositorio con código "${cloneCode}"` };
            }

            // 2. Verificar que no sea del mismo proyecto
            if (sourceRepo.project_id === this.currentProject.id) {
                return { success: false, message: 'Error: No puedes clonar un repositorio del mismo proyecto' };
            }

            // 3. Crear nuevo repositorio
            const newRepoName = `${sourceRepo.name}-clonado`;
            const { data: newRepo, error: createError } = await this.supabase
                .from('repositories')
                .insert([{
                    name: newRepoName,
                    description: `Clonado de: ${sourceRepo.name}`,
                    project_id: this.currentProject.id,
                    created_by: this.currentUser.id
                }])
                .select()
                .single();

            if (createError) throw createError;

            // 4. Obtener rama main del repositorio clonado
            const { data: sourceBranch } = await this.supabase
                .from('branches')
                .select('id')
                .eq('repository_id', sourceRepo.id)
                .eq('is_main', true)
                .single();

            // 5. Obtener todos los archivos del repositorio original
            const { data: sourceFiles, error: filesError } = await this.supabase
                .from('project_files')
                .select('*')
                .eq('repository_id', sourceRepo.id)
                .eq('branch_id', sourceBranch.id);

            if (filesError) throw filesError;

            // 6. Obtener rama main del nuevo repositorio
            const { data: newBranch } = await this.supabase
                .from('branches')
                .select('id')
                .eq('repository_id', newRepo.id)
                .eq('is_main', true)
                .single();

            // 7. Clonar archivos
            const filesToInsert = sourceFiles.map(file => ({
                project_id: this.currentProject.id,
                repository_id: newRepo.id,
                branch_id: newBranch.id,
                file_name: file.file_name,
                file_path: file.file_path,
                file_type: file.file_type,
                content: file.content,
                is_folder: file.is_folder,
                created_by: this.currentUser.id
            }));

            if (filesToInsert.length > 0) {
                const { error: insertError } = await this.supabase
                    .from('project_files')
                    .insert(filesToInsert);

                if (insertError) throw insertError;
            }

            return {
                success: true,
                message: `✓ Repositorio clonado exitosamente\n  Nombre: ${newRepoName}\n  Archivos clonados: ${sourceFiles.length}\n  Rama: main`
            };

        } catch (error) {
            console.error('Error clonando repositorio:', error);
            return { success: false, message: `Error: ${error.message}` };
        }
    }

    // ================================
    // COMANDO: opm delete repo <nombre>
    // ================================
    async handleDelete(args) {
        if (!args[0] || args[0] !== 'repo') {
            return { success: false, message: 'Error: Uso correcto: opm delete repo <nombre>' };
        }

        if (!args[1]) {
            return { success: false, message: 'Error: Debes especificar el nombre del repositorio' };
        }

        const repoName = args.slice(1).join(' ');

        try {
            // Buscar repositorio
            const { data: repo, error: findError } = await this.supabase
                .from('repositories')
                .select('id, name')
                .eq('project_id', this.currentProject.id)
                .ilike('name', repoName)
                .single();

            if (findError || !repo) {
                return { success: false, message: `Error: No se encontró repositorio "${repoName}"` };
            }

            // Eliminar (CASCADE eliminará branches y files automáticamente)
            const { error: deleteError } = await this.supabase
                .from('repositories')
                .delete()
                .eq('id', repo.id);

            if (deleteError) throw deleteError;

            return {
                success: true,
                message: `✓ Repositorio "${repo.name}" eliminado exitosamente`
            };

        } catch (error) {
            console.error('Error eliminando repositorio:', error);
            return { success: false, message: `Error: ${error.message}` };
        }
    }

    // ================================
    // COMANDO: opm create branch <nombre>
    // ================================
    async handleCreate(args) {
        if (!args[0] || args[0] !== 'branch') {
            return { success: false, message: 'Error: Uso correcto: opm create branch <nombre>' };
        }

        if (!args[1]) {
            return { success: false, message: 'Error: Debes especificar el nombre de la rama' };
        }

        if (!this.currentRepository) {
            return { success: false, message: 'Error: Debes estar dentro de un repositorio para crear ramas' };
        }

        const branchName = args[1];

        try {
            // Verificar que no exista
            const { data: existing } = await this.supabase
                .from('branches')
                .select('id')
                .eq('repository_id', this.currentRepository.id)
                .eq('branch_name', branchName)
                .single();

            if (existing) {
                return { success: false, message: `Error: La rama "${branchName}" ya existe` };
            }

            // Crear nueva rama
            const { data: newBranch, error: branchError } = await this.supabase
                .from('branches')
                .insert([{
                    repository_id: this.currentRepository.id,
                    branch_name: branchName,
                    is_main: false,
                    created_by: this.currentUser.id
                }])
                .select()
                .single();

            if (branchError) throw branchError;

            // Copiar archivos de rama actual
            const { data: currentFiles } = await this.supabase
                .from('project_files')
                .select('*')
                .eq('repository_id', this.currentRepository.id)
                .eq('branch_id', this.currentBranch.id);

            if (currentFiles && currentFiles.length > 0) {
                const filesToInsert = currentFiles.map(file => ({
                    project_id: file.project_id,
                    repository_id: file.repository_id,
                    branch_id: newBranch.id,
                    file_name: file.file_name,
                    file_path: file.file_path,
                    file_type: file.file_type,
                    content: file.content,
                    is_folder: file.is_folder,
                    created_by: this.currentUser.id
                }));

                await this.supabase
                    .from('project_files')
                    .insert(filesToInsert);
            }

            return {
                success: true,
                message: `✓ Rama "${branchName}" creada exitosamente\n  Archivos copiados: ${currentFiles?.length || 0}`
            };

        } catch (error) {
            console.error('Error creando rama:', error);
            return { success: false, message: `Error: ${error.message}` };
        }
    }

    // ================================
    // COMANDO: opm switch <rama>
    // ================================
    async switchBranch(args) {
        if (!args[0]) {
            return { success: false, message: 'Error: Debes especificar el nombre de la rama\nUso: opm switch <rama>' };
        }

        if (!this.currentRepository) {
            return { success: false, message: 'Error: Debes estar dentro de un repositorio' };
        }

        const branchName = args[0];

        try {
            const { data: branch, error } = await this.supabase
                .from('branches')
                .select('*')
                .eq('repository_id', this.currentRepository.id)
                .eq('branch_name', branchName)
                .single();

            if (error || !branch) {
                return { success: false, message: `Error: La rama "${branchName}" no existe` };
            }

            this.currentBranch = branch;

            return {
                success: true,
                message: `✓ Cambiado a rama "${branchName}"`,
                reload: true
            };

        } catch (error) {
            console.error('Error cambiando de rama:', error);
            return { success: false, message: `Error: ${error.message}` };
        }
    }

    // ================================
    // COMANDO: opm merge main
    // ================================
    async mergeBranch(args) {
        if (!args[0] || args[0] !== 'main') {
            return { success: false, message: 'Error: Por ahora solo puedes hacer merge a main\nUso: opm merge main' };
        }

        if (!this.currentRepository || !this.currentBranch) {
            return { success: false, message: 'Error: Debes estar en una rama para hacer merge' };
        }

        if (this.currentBranch.is_main) {
            return { success: false, message: 'Error: Ya estás en la rama main' };
        }

        try {
            // Obtener rama main
            const { data: mainBranch } = await this.supabase
                .from('branches')
                .select('id')
                .eq('repository_id', this.currentRepository.id)
                .eq('is_main', true)
                .single();

            // Obtener archivos de rama actual
            const { data: currentFiles } = await this.supabase
                .from('project_files')
                .select('*')
                .eq('branch_id', this.currentBranch.id);

            // Obtener archivos de main
            const { data: mainFiles } = await this.supabase
                .from('project_files')
                .select('*')
                .eq('branch_id', mainBranch.id);

            let updated = 0;
            let inserted = 0;

            for (const file of currentFiles) {
                const mainFile = mainFiles.find(f => f.file_path === file.file_path);

                if (mainFile) {
                    // Actualizar archivo existente
                    await this.supabase
                        .from('project_files')
                        .update({ content: file.content })
                        .eq('id', mainFile.id);
                    updated++;
                } else {
                    // Insertar nuevo archivo
                    await this.supabase
                        .from('project_files')
                        .insert([{
                            project_id: file.project_id,
                            repository_id: file.repository_id,
                            branch_id: mainBranch.id,
                            file_name: file.file_name,
                            file_path: file.file_path,
                            file_type: file.file_type,
                            content: file.content,
                            is_folder: file.is_folder,
                            created_by: this.currentUser.id
                        }]);
                    inserted++;
                }
            }

            return {
                success: true,
                message: `✓ Merge completado exitosamente\n  Archivos actualizados: ${updated}\n  Archivos nuevos: ${inserted}`
            };

        } catch (error) {
            console.error('Error haciendo merge:', error);
            return { success: false, message: `Error: ${error.message}` };
        }
    }

    // ================================
    // COMANDO: opm list branches
    // ================================
    async listBranches(args) {
        if (!args[0] || args[0] !== 'branches') {
            return { success: false, message: 'Error: Uso correcto: opm list branches' };
        }

        if (!this.currentRepository) {
            return { success: false, message: 'Error: Debes estar dentro de un repositorio' };
        }

        try {
            const { data: branches, error } = await this.supabase
                .from('branches')
                .select('*')
                .eq('repository_id', this.currentRepository.id)
                .order('created_at', { ascending: true });

            if (error) throw error;

            let output = '\nRamas disponibles:\n';
            branches.forEach(branch => {
                const indicator = branch.id === this.currentBranch?.id ? '* ' : '  ';
                const mainTag = branch.is_main ? ' (main)' : '';
                output += `${indicator}${branch.branch_name}${mainTag}\n`;
            });

            return { success: true, message: output };

        } catch (error) {
            console.error('Error listando ramas:', error);
            return { success: false, message: `Error: ${error.message}` };
        }
    }

    // ================================
    // COMANDO: opm current
    // ================================
    async showCurrent() {
        let output = '\n';
        output += `Proyecto: ${this.currentProject?.name || 'Sin proyecto'}\n`;
        output += `Repositorio: ${this.currentRepository?.name || 'Sin repositorio'}\n`;
        output += `Rama: ${this.currentBranch?.branch_name || 'Sin rama'}\n`;

        if (this.currentRepository) {
            const { data: repo } = await this.supabase
                .from('repositories')
                .select('clone_code')
                .eq('id', this.currentRepository.id)
                .single();

            if (repo) {
                output += `Código de clonación: ${repo.clone_code}\n`;
            }
        }

        return { success: true, message: output };
    }

    // ================================
    // COMANDO: opm help
    // ================================
    showHelp() {
        const helpText = `
Comandos disponibles de OPM:

opm clone <código>           → Clona un repositorio usando su código único
opm delete repo <nombre>     → Elimina un repositorio del proyecto
opm create branch <nombre>   → Crea una nueva rama desde la rama actual
opm switch <rama>            → Cambia a otra rama
opm merge main              → Fusiona la rama actual con main
opm list branches           → Lista todas las ramas del repositorio
opm current                 → Muestra información del contexto actual
opm help                    → Muestra esta ayuda
opm clear                   → Limpia la consola

Ejemplos:
  opm clone ABC12XYZ
  opm create branch desarrollo
  opm switch main
  opm merge main
`;
        return { success: true, message: helpText };
    }

    clearConsole() {
        return { success: true, clear: true };
    }

    // ================================
    // MÉTODO PRINCIPAL
    // ================================
    async execute(input) {
        const parts = input.trim().split(/\s+/);
        const command = parts[1]?.toLowerCase();
        const args = parts.slice(2);

        if (parts[0] !== 'opm') {
            return { success: false, message: 'Error: Los comandos deben empezar con "opm"' };
        }

        if (!command) {
            return { success: false, message: 'Error: Debes especificar un comando. Usa "opm help" para ver la lista.' };
        }

        const handler = this.commands[command];
        if (!handler) {
            return { success: false, message: `Error: Comando desconocido "${command}". Usa "opm help" para ver los comandos disponibles.` };
        }

        return await handler(args);
    }
}

// ================================
// INTEGRACIÓN CON LA UI
// ================================

// Agregar al código existente después de las variables globales
let opmConsole = null;

// Inicializar cuando se cargue el editor
async function initializeOPMConsole() {
    if (currentUser && currentProject && supabaseClient) {
        opmConsole = new OPMConsole(supabaseClient, currentUser, currentProject);
        
        // Cargar rama actual si hay repositorio seleccionado
        if (selectedRepository) {
            const { data: mainBranch } = await supabaseClient
                .from('branches')
                .select('*')
                .eq('repository_id', selectedRepository.id)
                .eq('is_main', true)
                .single();
            
            if (mainBranch) {
                opmConsole.currentRepository = selectedRepository;
                opmConsole.currentBranch = mainBranch;
                currentBranch = mainBranch;
            }
        }
    }
}

// Actualizar contexto cuando cambie el repositorio
async function updateOPMContext(repository) {
    if (opmConsole && repository) {
        opmConsole.currentRepository = repository;
        
        const { data: mainBranch } = await supabaseClient
            .from('branches')
            .select('*')
            .eq('repository_id', repository.id)
            .eq('is_main', true)
            .single();
        
        if (mainBranch) {
            opmConsole.currentBranch = mainBranch;
            currentBranch = mainBranch;
        }
    }
}

// Función para mostrar/ocultar consola
function toggleOPMConsole() {
    const panel = document.getElementById('console-panel');
    const btn = document.getElementById('console-toggle-btn');
    
    if (panel.classList.contains('open')) {
        panel.classList.remove('open');
        btn.classList.remove('active');
    } else {
        panel.classList.add('open');
        btn.classList.add('active');
        document.getElementById('console-input').focus();
    }
}

// Procesar comando ingresado
async function processOPMCommand(event) {
    if (event.key !== 'Enter') return;
    
    const input = event.target;
    const command = input.value.trim();
    
    if (!command) return;
    
    // Agregar a historial
    consoleHistory.push(command);
    historyIndex = consoleHistory.length;
    
    // Mostrar comando en output
    appendToConsole(`$ ${command}`, 'output');
    
    // Ejecutar comando
    if (opmConsole) {
        const result = await opmConsole.execute(command);
        
        if (result.clear) {
            clearConsoleOutput();
        } else {
            const type = result.success ? 'success' : 'error';
            appendToConsole(result.message, type);
        }
        
        if (result.reload && selectedRepository) {
            // Recargar archivos con nueva rama
            await loadRepositoryFiles(selectedRepository.id);
        }
    } else {
        appendToConsole('Error: Consola no inicializada', 'error');
    }
    
    input.value = '';
    updatePrompt();
}

// Navegar historial con flechas
function handleConsoleKeydown(event) {
    const input = event.target;
    
    if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (historyIndex > 0) {
            historyIndex--;
            input.value = consoleHistory[historyIndex];
        }
    } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (historyIndex < consoleHistory.length - 1) {
            historyIndex++;
            input.value = consoleHistory[historyIndex];
        } else {
            historyIndex = consoleHistory.length;
            input.value = '';
        }
    }
}

function appendToConsole(text, type) {
    const output = document.getElementById('console-output');
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    line.textContent = text;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
}

function clearConsoleOutput() {
    document.getElementById('console-output').innerHTML = '';
}

function updatePrompt() {
    const prompt = document.getElementById('console-prompt');
    let path = 'OpenMind';
    
    if (currentProject) {
        path += `:/projects/${currentProject.name}`;
        
        if (selectedRepository) {
            path += `/${selectedRepository.name}`;
            
            if (currentBranch && !currentBranch.is_main) {
                path += ` (${currentBranch.branch_name})`;
            }
        }
    }
    
    prompt.textContent = path + '>';
}

// Exportar funciones globales necesarias
window.toggleOPMConsole = toggleOPMConsole;
window.processOPMCommand = processOPMCommand;
window.handleConsoleKeydown = handleConsoleKeydown;
window.initializeOPMConsole = initializeOPMConsole;
window.updateOPMContext = updateOPMContext;
window.updatePrompt = updatePrompt;

console.log('✓ Sistema de Consola OPM cargado correctamente');