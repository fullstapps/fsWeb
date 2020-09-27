---
title: 'Creando nuestro primer Angular Schematics'
description: 'blog description'
published: true
---

# Creando nuestro primer Angular Schematics
Si llegaste hasta aquí, es porque lo mas probable es que hayas utilizado algún Schematic pero ahora quieres entender como funcionan y como crear uno. 

Angular Schematics fue creado por el equipo de Angular para ayudarnos a automatizar nuestros proyectos, permitiendo crear reglas para crear archivos, correr o remover dependencias, entre otras cosas. El más usado por todos es el Angular Cli, por debajo es un Schematics que nos ayuda a crear nuestros componentes, servicios, etc. de manera sencilla.

En este post te mostraremos paso a paso cómo crear tu primer Schematics, explicaremos cada funcionalidad que lo compone y abordaremos un caso de uso que puede ser común para aplicar un Schematics.

Primeramente debemos instalar @angular-devkit/schematics-cli

```
npm install -g @angular-devkit/schematics-cli
```

Generamos nuestro primer schematics.. 
```
schematics blank init
```
Ahora veamos que nos genera el schematics-cli 
![code1](https://dev-to-uploads.s3.amazonaws.com/i/c4vigkg8qqp8rzx8xtws.png)

Tenemos los archivos comunes package.json, tsconfig.json etc

En la carpeta src estarán nuestros schematics, en este caso solo está el schematic init, que fue el que creamos.

### collection.json
Es nuestro principal archivo de definición de todos los esquemas disponibles que tendremos.

```json
{
  "$schema": "../node_modules/@angular-devkit/schematics/collection-schema.json",
  "schematics": {
    "init": {
      "description": "A blank schematic.",
      "factory": "./init/index#init"
    }
  }
}
```
Aquí podemos ver que cada schematic por defecto tiene una descripción y un factory, que es la función principal donde inicia el schematic.

```ts
import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function init(_options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    return tree;
  };
}
```
 Podemos ver la función init donde nos devuelve un Rule y acepta el parámetro llamado _options, para poder pasarle parámetros y definir comportamientos dentro de la función.

### Rule
La "Regla" se llama con un árbol (tree: Tree) y un schematicContext, para realizar cambios en el arbol y se retorna para su procesamiento posterior.

### Tree
El Tree o árbol es una representación virtual de cada archivo en nuestro workspace, es lo que necesitamos para lograr el objetivo de los Shematics, generar código y realizar cambios en archivos existentes. Todas las Rules se tienen que ejecutar correctamente para ver representados los cambios en el código.

Vamos a ir creando nuestro schematics y aumentando un poco la complejidad.

En este primer caso, vamos a crear un archivo .js con un console.log adentro.

```ts
export function init(_options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    tree.create('hello.js', `console.log('Frontend Rules');`);
    return tree;
  };
}
```
Esto creará un hello.js en la raíz del proyecto donde ejecutemos el schematics.

Lo podemos probar de la siguiente manera:

Primero hacemos build de nuestro schematics para compilar nuestros archivos .ts

```
$ npm run build 
```
Luego podemos probar el schematics de dos maneras:

```
$ schematics .:init
$ schematics .:init --debug=false
```

De la primera forma va a correr el schematic de manera virtual y nos indicará si existe algún error o no.

Si lo ejecutamos con el —debug=false si crea el archivo hello.js en nuestra raíz.


![Alt Text](https://dev-to-uploads.s3.amazonaws.com/i/g7iruiasrus4rfxqlms7.png)

### Options
A la hora de generar schematics podemos pasarle distintos parámetros a ese schematics para ayudarnos a automatizar mucho mejor. En este caso pasaremos un parámetro name para incluirlo en el console.log

Una opcion es pasarlo inline

```
$ scheamtics .:init --name=Henry
```

Esto funciona y el _options lo recibirá correctamente, pero podemos hacerlo mucho mejor ¿de qué manera? Podemos definir un schema específico para el init y en este schema podemos restringir qué opciones se le deben pasar y si queremos que sean desde el prompt, entre muchas definiciones más.

Creamos nuestro archivo schema.json dentro del schema init.

init/schema.json

```json
{
    "$schema": "http://json-schema.org/schema",
    "id": "InitSchematics",
    "title": "Init Options Schema",
    "type": "object",
    "description": "Saludar a un dev",
    "properties": {
        "name": {
            "type": "string",
            "description": "Name of dev",
            "$default": {
                "$source": "argv",
                "index": 0
            },
            "x-prompt": "A quien de frontend quieres saludar?"
        }
    },
    "required": [
        "name"
    ]
}
```

En el collection.json debemos apuntar el schema nuevo creado
```json
"init": {
      "description": "A blank schematic.",
      "factory": "./init/index#init",
      "schema": "./hello/schema.json"
 }
```
Y ahora nuestro factory quedaria de la siguiente manera
```ts
export function init(_options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    tree.create('hello.js', `console.log('Hi ${_options.name}Frontend Rules');`);
    return tree;
  };
}
```

![Alt Text](https://dev-to-uploads.s3.amazonaws.com/i/ces09ght8rrx3sxk17z3.png)

Y se crea el archivo con el parámetro recibido tal cual lo creamos.

### Templates
Se puede generar código de una mejor manera y automatizada, gracias a los templates. 
Tal cual como funciona el ng  g c 'name' del **angular cli.** 

Todo esto de los templates debe tener un formato especifico que es medio extraño que a continuación les explico.

Dentro de src/init creamos la carpeta **files** y ahí adentro creamos nuestro template, esto debe ser así ya que por configuración todo lo que este dentro de files no se va a compilar, esta excluido. 

Creamos esta estructura dentro de scr
```
- src/init/files/hello-__name@dasherize__/
	               hello-__name@dasherize__.ts
			
```

El __ (underscore) quiere decir que separa las variables y tenemos la función auxiliar dasherize que hace algo como **NombreMio** a nombre-mio

Y nuestro template quedaría de la siguiente manera:
```ts
console.log('Hi <%= name %> Frontend Rules');
```

Ahora modificamos nuestra Rule:

```ts
import { strings } from '@angular-devkit/core';
import { apply, mergeWith, Rule, SchematicContext, template, Tree, url } from '@angular-devkit/schematics';


// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function init(_options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const sourceTemplates =  url('./files');
    const sourceParametrizedTemplates = apply(sourceTemplates, [
      template({
        ..._options,
        ...strings
      })
    ]);

    return mergeWith(sourceParametrizedTemplates)(tree, _context);
    
  };
}
```
Una vez ya tenemos nuestro schematic, una buena practica es crear una aplicación angular llamada sandbox donde haremos nuestras pruebas. 

La creamos dentro de nuestro proyecto
```
ng new sandbox
```
Nos dirigimos a nuestra aplicación sandbox y linkeamos nuestro schematic

Y ejecutamos nuestro schematic en el proyecto sandbox

```
npm link $PATH-PROJECT/init
schematics ..:init --debug false
```
Esto es solo el principio de un mundo bastante amplio como son los Schematics de Angular. 

Les dejo unos schematics de ejemplo para que se puedan guiar:
[https://github.com/briebug/jest-schematic](https://github.com/briebug/jest-schematic)

Este schematics es de la gente de briebug donde nos ayudan a cambiar toda la configuración de Karma y Jasmine a Jest para nuestras pruebas unitarias

Por supuesto los schematics de angular que utiliza el angular-cli

[https://github.com/angular/angular-cli/tree/8ffb755ef084d358638045dd58e2f5f0297139a1/packages/schematics/angular](https://github.com/angular/angular-cli/tree/8ffb755ef084d358638045dd58e2f5f0297139a1/packages/schematics/angular)

Espero les haya gustado, cualquier cosa comenten o escríbanme

Esto funciona y el _options lo recibirá correctamente, pero podemos hacerlo mucho mejor ¿de qué manera? Podemos definir un schema específico para el init y en este schema podemos restringir qué opciones se le deben pasar y si queremos que sean desde el prompt, entre muchas definiciones más.

Repo del proyecto: https://github.com/HenryGBC/angular-shematics-example
Mi twitter: https://twitter.com/HenryGBC
Mi Github: https://github.com/HenryGBC