CREATE DATABASE IF NOT EXISTS `gestion_eventos`;

USE `gestion_eventos`;


DROP TABLE IF EXISTS `evento`;
DROP TABLE IF EXISTS `tipoentrada`;
DROP TABLE IF EXISTS `participante`;
DROP TABLE IF EXISTS `organizador`;
DROP TABLE IF EXISTS `formadepago`;
DROP TABLE IF EXISTS `lugarevento`;
DROP TABLE IF EXISTS `usuario`;


CREATE TABLE `gestion_eventos`.`usuario` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  `apellido` VARCHAR(255) NOT NULL,
  `dni` INT UNSIGNED NOT NULL,
  `contrasena` VARCHAR(255) NOT NULL,
  `mail` VARCHAR(255) NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE (`dni`),
  UNIQUE (`mail`)
);


CREATE TABLE `gestion_eventos`.`organizador` (
  `idOrganizador` INT UNSIGNED NOT NULL,

  PRIMARY KEY (`idOrganizador`),

  CONSTRAINT `fk_organizador_usuario`
    FOREIGN KEY (`idOrganizador`)
    REFERENCES `gestion_eventos`.`usuario` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);


CREATE TABLE `gestion_eventos`.`participante` (
  `idParticipante` INT UNSIGNED NOT NULL,

  PRIMARY KEY (`idParticipante`),

  CONSTRAINT `fk_participante_usuario`
    FOREIGN KEY (`idParticipante`)
    REFERENCES `gestion_eventos`.`usuario` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);


CREATE TABLE `gestion_eventos`.`formadepago` (
  `idFormaDePago` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tipo` VARCHAR(32) NOT NULL,

  PRIMARY KEY (`idFormaDePago`)
);


CREATE TABLE `gestion_eventos`.`lugarevento` (
  `idLugarEvento` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,

  PRIMARY KEY (`idLugarEvento`)
);


CREATE TABLE `gestion_eventos`.`tipoentrada` (
  `idTipoEntrada` INT UNSIGNED NOT NULL,
  `idLugarEvento` INT UNSIGNED NOT NULL,
  `cantidad` INT UNSIGNED NOT NULL,
  `ubicacion` VARCHAR(255) NOT NULL,
  `esNumerada` TINYINT NOT NULL,

  PRIMARY KEY (`idTipoEntrada`, `idLugarEvento`),

  CONSTRAINT `fk_tipoentrada_lugarevento`
    FOREIGN KEY (`idLugarEvento`)
    REFERENCES `gestion_eventos`.`lugarevento` (`idLugarEvento`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);


CREATE TABLE `gestion_eventos`.`evento` (
  `idEvento` INT UNSIGNED NOT NULL,
  `idLugarEvento` INT UNSIGNED NOT NULL,
  `descripcion` VARCHAR(255) NOT NULL,
  `estado` VARCHAR(32) NOT NULL,
  `imagenportada` VARCHAR(255) NOT NULL,
  `fecha` DATE NOT NULL,
  `horaInicio` TIME NOT NULL,
  `horaFin` TIME NOT NULL,

  PRIMARY KEY (`idEvento`, `idLugarEvento`),

  CONSTRAINT `fk_evento_lugarevento`
    FOREIGN KEY (`idLugarEvento`)
    REFERENCES `gestion_eventos`.`lugarevento` (`idLugarEvento`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);


INSERT INTO `gestion_eventos`.`usuario`
VALUES (1,'Juan','Perez',12345678,'contrasena123','juan.perez@example.com');


INSERT INTO `gestion_eventos`.`usuario`
VALUES (2,'Jimena','Rodriguez',87654321,'contrasena456','jimena.rodriguez@example.com');


INSERT INTO `gestion_eventos`.`organizador`
VALUES (1);


INSERT INTO `gestion_eventos`.`participante`
VALUES (2);


INSERT INTO `gestion_eventos`.`formadepago`
VALUES (1, 'Efectivo');


INSERT INTO `gestion_eventos`.`lugarevento`
VALUES (1, 'Teatro Broadway');


INSERT INTO `gestion_eventos`.`tipoentrada`
VALUES (1,1,500,'Platea San Martin',1);


INSERT INTO `gestion_eventos`.`evento`
VALUES (1,1,'Evento re divertido','disponible','imagen','2026-08-13','15:00:00','18:00:00');