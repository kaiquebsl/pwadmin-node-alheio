const os = require('os');
const fs = require('fs').promises;
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const getMemoryUsagePercentage = async (req, res)  => { //precisa ser revisto
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const percentage = (usedMemory / totalMemory) * 100;
    const memoryUsagePercentage = percentage.toFixed(2)
    res.json(memoryUsagePercentage);
   //return { memoryUsagePercentage: percentage.toFixed(2) };
  };
  
  const readServerComponentsConfig = async () => {
    try {
      const configFile = await fs.readFile('configs.conf', 'utf-8');
      const serverComponentsLine = configFile
        .split('\n')
        .find((line) => line.startsWith('server-components='));
  
      if (!serverComponentsLine) {
        throw new Error('A linha "server-components=" não foi encontrada no arquivo de configuração.');
      }
  
      const serverComponents = serverComponentsLine
        .split('=')[1]
        .split(',')
        .map((component) => component.trim())
        .filter((component) => component.length > 0);
      //console.log(serverComponents);
      return serverComponents;
    } catch (error) {
      console.error('Erro ao ler o arquivo de configuração:', error.message);
      throw error;
    }
  };
  
  const getProcessInfo = async (processName) => {
    try {
      const { stdout } = await exec(`ps ax | grep ${processName}`);
      const processInstances = stdout
        .split('\n')
        .filter(line => line.includes(processName))
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.includes('grep --color=auto'));
      //console.log(processName);
      const processInfoArray = processInstances.map(line => {
        const pidMatch = line.match(/\b(\d+)\b/); // Tenta extrair o primeiro número como PID
  
        if (pidMatch) {
          const pid = parseInt(pidMatch[1]);
          //console.log(processName + " PID: " + pid);
          return {
          name: processName,
          exists: processInstances.length -2 > 0,
          count: processInstances.length -2,
          pid: parseInt(pid),
          };
        } else {
          return null; // Retorna nulo se não encontrar um número como PID
        }
      });

      return processInfoArray.length > 0 ? processInfoArray[0] : { name: processName, exists: false, count: 0 };
    } catch (error) {
      console.error('Erro ao obter informações do processo:', error.message);
      throw error;
    }
  };
  
  const handleMemoryUsage = async (req, res) => {
    try {
      const serverComponents = await readServerComponentsConfig();
      const processInfoArray = [];
  
      for (const processName of serverComponents) {
        const processInfo = await getProcessInfo(processName);
        processInfoArray.push({processInfo});
      }
  
      return res.status(200).json(processInfoArray);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erro ao obter informações do processo' });
    }
  };

  const getActiveInstances = async (req, res) => { //BRUH KKKKKKKKKKKKKKKKK
    const InstancesList = ['gs01','is01','is02','is12','is13','is18','is19','is20','is21','is22','is32','is33','is34','arena01','arena02','arena03','arena04','is05','is06','is07','is08','is09','is10','is11','is14','is15','is16','is17','is23','is24','is25','is26','is27','is28','is29','is31','arena05','bg01','bg02','bg03','bg04','bg05','bg06'];
    const ActiveInstances = [];
    try{

    
    for (const instance of InstancesList){
      const instanceactive = await getProcessInfo(instance);
      ActiveInstances.push({instanceactive});
    }
    return res.status(200).json(ActiveInstances);
    }catch (err){
      return res.status(500).json({ message: 'Erro ao obter informações do processo' });
    }
  }

  const handleInstanceStart = async (req, res) => { //instances.post
    const { instance } = req.body;
    if (!instance){
    return res.status(400).json({'message': 'Instância não especificada'});
    }
    const alreadyactive = await getProcessInfo(instance);
    if(alreadyactive.count > 0){
    return res.status(500).json({'message': 'Instancia já ativa'});
    }
    try{ //re-fazer para receber path dinâmico
    await executeCommand(`cd /home/gamed; ./gs ${instance} > "/home/logs/${instance}_${currentDate}_std.log" 2> "/home/logs/${instance}_${currentDate}_err.log" &`);
    return res.status(200).json({'message': 'Instancia iniciada com sucesso'}); 
    } catch (err){
      return res.status(500).json({'message': 'Erro ao iniciar instância'});
    }
  }

  const handleInstanceStop = async (req, res) => {
    const { instance } = req.body;
    if(!instance){
      return res.status(400).json({'message':'Instancia não especificada'});
    }
    const instanceinfo = await getProcessInfo(instance);
    if(instanceinfo.count <=0) {
      return res.status(500).json({'message': 'Instancia não ativa'});
    }
    try{
      await executeCommand(`kill -9 ${instanceinfo.pid}`);
      await new Promise(resolve =>setTimeout(resolve, 1000));
      const processInfoAfterStop = await getProcessInfo(instance);

      if (processInfoAfterStop.count <= 0) {
        return res.status(200).json({ 'message': 'Instancia encerrada com sucesso' });
      } else {
        return res.status(500).json({ 'message': 'Falha ao encerrar a instancia' });
      }
    }catch (err){
      console.error(err);
    return res.status(500).json({ 'message': 'Erro ao encerrar a instancia' });
    }
  };

  function formatCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
  
    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  }
  const currentDate = formatCurrentDate();

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const executeCommand = async (command) => {
    try {
      const { stdout, stderr } = await exec(command);
     // console.log(`Executando: ${command}`);
     // console.log('stdout: ', stdout);
    } catch (error) {
      console.error('Error executing command:', error);
    }
  };
  

const handleServerStart = async (req, res) => { //mt feio
    try {
        await executeCommand(`cd /home/logservice; ./logservice logservice.conf > "/home/logs/logservice_${currentDate}_std.log" 2> "/home/logs/logservice_${currentDate}_err.log" &`);
        await sleep(300);
        await executeCommand(`cd /home/uniquenamed; ./uniquenamed gamesys.conf > "/home/logs/uniquenamed_${currentDate}_std.log" 2> "/home/logs/uniquenamed_${currentDate}_err.log" &`);
        await sleep(300);
        await executeCommand(`cd /home/authd; ./authd start > "/home/logs/authd_${currentDate}_std.log" 2> "/home/logs/authd_${currentDate}_err.log" &`);
        await sleep(300);
        await executeCommand(`cd /home/gamedbd; ./gamedbd gamesys.conf > "/home/logs/gamedbd_${currentDate}_std.log" 2> "/home/logs/gamedbd_${currentDate}_err.log" &`);
        await sleep(3000);
        await executeCommand(`cd /home/gacd; ./gacd gamesys.conf > "/home/logs/gacd_${currentDate}_std.log" 2> "/home/logs/gacd_${currentDate}_err.log" &`);
        await sleep(2000);
        await executeCommand(`cd /home/gfactiond; ./gfactiond gamesys.conf > "/home/logs/gfactiond_${currentDate}_std.log" 2> "/home/logs/gfactiond_${currentDate}_err.log" &`);
        await sleep(2000);
        await executeCommand(`cd /home/gdeliveryd; ./gdeliveryd gamesys.conf > "/home/logs/gdeliveryd_${currentDate}_std.log" 2> "/home/logs/gdeliveryd_${currentDate}_err.log" &`);
        await sleep(600);
        await executeCommand(`cd /home/glinkd; ./glinkd gamesys.conf 1 > "/home/logs/glinkd 1_${currentDate}_std.log" 2> "/home/logs/glinkd 1_${currentDate}_err.log" &`);
        await sleep(300)
        await executeCommand(`cd /home/glinkd; ./glinkd gamesys.conf 2 > "/home/logs/glinkd 2_${currentDate}_std.log" 2> "/home/logs/glinkd 2_${currentDate}_err.log" &`);
        await sleep(300);
        await executeCommand(`cd /home/glinkd; ./glinkd gamesys.conf 3 > "/home/logs/glinkd 3_${currentDate}_std.log" 2> "/home/logs/glinkd 3_${currentDate}_err.log" &`);
        await sleep(300);
        await executeCommand(`cd /home/glinkd; ./glinkd gamesys.conf 4 > "/home/logs/glinkd 4_${currentDate}_std.log" 2> "/home/logs/glinkd 4_${currentDate}_err.log" &`);
        await sleep(300);
        await executeCommand(`cd /home/gamed; ./gs gs01 > "/home/logs/gs01_${currentDate}_std.log" 2> "/home/logs/gs01_${currentDate}_err.log" &`);
        await sleep(100);
        res.status(200).json({'message':'Servidor iniciado com sucessoo'});
    }catch (err){
        console.log(err);
        res.status(500).json({'erro':`erro interno ${err}`});
    } 
}

const handleServerStop = async (req, res) => {
  try{
    await executeCommand('pkill -9 gs');
    await sleep(1000);
    await executeCommand('pkill -9 gamedbd');
    await sleep(1000);
    await executeCommand('pkill -9 gdeliveryd');
    await sleep(500);
    await executeCommand('pkill -9 gfactiond');
    await sleep(300);
    await executeCommand('pkill -9 authd');
    await sleep(100);
    await executeCommand('pkill -9 uniquenamed');
    await sleep(100);
    await executeCommand('pkill -9 glinkd');
    await sleep(100);
    await executeCommand('pkill -9 gacd');
    await sleep(100);
    await executeCommand('pkill -9 logservices');
    await sleep(100);
    await executeCommand('pkill -9 java');
    await sleep(100);
    res.status(200).json({'message': 'Servidor encerrado com sucesso'});
  }catch (err){
    console.log(err);
    res.status(500).json({'erro': `erro interno ${err}`});
  }
}

module.exports = {
    handleMemoryUsage,
    getMemoryUsagePercentage,
    handleServerStart,
    handleServerStop,
    getActiveInstances,
    handleInstanceStart,
    handleInstanceStop,
};
