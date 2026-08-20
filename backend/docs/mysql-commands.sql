CREATE DATABASE IF NOT EXISTS `event_management`;

USE `event_management`;

DROP TABLE IF EXISTS `organizer`;
DROP TABLE IF EXISTS `participant`;
DROP TABLE IF EXISTS `event`;
DROP TABLE IF EXISTS `tickettype`;
DROP TABLE IF EXISTS `paymentmethod`;
DROP TABLE IF EXISTS `venue`;

CREATE TABLE `event_management`.`user` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `type` VARCHAR(32) NOT NULL,
  `firstName` VARCHAR(255) NOT NULL,
  `lastName` VARCHAR(255) NOT NULL,
  `identityDocument` VARCHAR(50) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE (`identityDocument`),
  UNIQUE (`email`)
);


CREATE TABLE `event_management`.`paymentmethod` (
  `idPaymentMethod` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `type` VARCHAR(32) NOT NULL,

  PRIMARY KEY (`idPaymentMethod`)
);


CREATE TABLE `event_management`.`venue` (
  `idVenue` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,

  PRIMARY KEY (`idVenue`)
);


CREATE TABLE `event_management`.`tickettype` (
  `idTicketType` INT UNSIGNED NOT NULL,
  `idVenue` INT UNSIGNED NOT NULL,
  `quantity` INT UNSIGNED NOT NULL,
  `location` VARCHAR(255) NOT NULL,
  `isNumbered` TINYINT NOT NULL,

  PRIMARY KEY (`idTicketType`, `idVenue`),

  CONSTRAINT `fk_tickettype_venue`
    FOREIGN KEY (`idVenue`)
    REFERENCES `event_management`.`venue` (`idVenue`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);


CREATE TABLE `event_management`.`event` (
  `idEvent` INT UNSIGNED NOT NULL,
  `idVenue` INT UNSIGNED NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `status` VARCHAR(32) NOT NULL,
  `coverImage` VARCHAR(255) NOT NULL,
  `date` DATE NOT NULL,
  `startTime` TIME NOT NULL,
  `endTime` TIME NOT NULL,

  PRIMARY KEY (`idEvent`, `idVenue`),

  CONSTRAINT `fk_event_venue`
    FOREIGN KEY (`idVenue`)
    REFERENCES `event_management`.`venue` (`idVenue`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);


INSERT INTO `event_management`.`user` (`id`, `type`, `firstName`, `lastName`, `identityDocument`, `password`, `email`)
VALUES (1,'organizer','Juan','Perez','12345678','contrasena123','juan.perez@example.com');


INSERT INTO `event_management`.`user` (`id`, `type`, `firstName`, `lastName`, `identityDocument`, `password`, `email`)
VALUES (2,'participant','Jimena','Rodriguez','87654321','contrasena456','jimena.rodriguez@example.com');


INSERT INTO `event_management`.`paymentmethod`
VALUES (1, 'Efectivo');


INSERT INTO `event_management`.`venue`
VALUES (1, 'Teatro Broadway');


INSERT INTO `event_management`.`tickettype`
VALUES (1,1,500,'Platea San Martin',1);


INSERT INTO `event_management`.`event`
VALUES (1,1,'Evento re divertido','disponible','imagen','2026-08-13','15:00:00','18:00:00');