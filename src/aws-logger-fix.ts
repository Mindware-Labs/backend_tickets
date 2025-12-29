// src/aws-logger-fix.ts
export function disableAWSFileLogging() {
  console.log('[AWS LOGGER FIX] Applying production logging fix...');
  
  // 1. Deshabilitar completamente el módulo 'debug' (que escribe a archivos)
  try {
    const Module = require('module');
    const originalRequire = Module.prototype.require;
    
    Module.prototype.require = function(id: string) {
      // Interceptar el módulo 'debug' y retornar una versión dummy
      if (id === 'debug') {
        console.log('[AWS LOGGER FIX] Disabling debug module');
        const dummyDebug = (namespace: string) => {
          const logger = () => {};
          logger.enabled = false;
          logger.log = () => {};
          logger.debug = logger;
          logger.info = logger;
          logger.warn = logger;
          logger.error = logger;
          return logger;
        };
        
        dummyDebug.log = () => {};
        dummyDebug.enable = () => {};
        dummyDebug.disable = () => {};
        dummyDebug.names = [];
        dummyDebug.skips = [];
        return dummyDebug;
      }
      
      return originalRequire.apply(this, arguments);
    };
  } catch (err) {
    console.log('[AWS LOGGER FIX] Could not patch require:', err.message);
  }
  
  // 2. Configurar variables de entorno para AWS SDK
  process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = '1';
  process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = '1';
  process.env.DEBUG = ''; // Vacío para deshabilitar debug
  
  // 3. Interceptar intentos de abrir archivos .log
  process.on('uncaughtException', (error: any) => {
    if (error.code === 'EROFS' && error.path && error.path.includes('.log')) {
      console.warn('[AWS LOGGER FIX] Blocked log file write:', error.path);
      return; // No propagar el error
    }
    throw error;
  });
  
  console.log('[AWS LOGGER FIX] Production logging fix applied successfully');
}