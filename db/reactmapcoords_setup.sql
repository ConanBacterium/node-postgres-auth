CREATE TABLE project (
    project_id SERIAL PRIMARY KEY,
    originator VARCHAR(50) REFERENCES bruger (username),
    insertion_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP (0) -- 0 for no miliseconds
);

CREATE TABLE subproject (
    subproject_id SERIAL PRIMARY KEY, 
    originator VARCHAR(50) REFERENCES bruger (username),
    name VARCHAR(100),
    insertion_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP (0) -- 0 for no miliseconds
);

/* CREATE TABLE subprojectcategory(
    subprojectcategory_id VARCHAR(50) PRIMARY KEY
);

CREATE TABLE subproject_subprojectcategory(
    subproject_id REFERENCES subproject (subproject_id),
    subprojectcategory_id REFERENCES subprojectcategory (subprojectcategory_id),
    PRIMARY KEY (subproject_id, subprojectcategory_id)
); */

CREATE TABLE subproject_project(
    subproject_id INT REFERENCES subproject (subproject_id),
    project_id INT REFERENCES project (project_id),
    PRIMARY KEY (subproject_id, project_id)
);

CREATE TABLE polygon_subproject(
    polygon_id INT REFERENCES polygon (polygon_id),
    subproject_id INT REFERENCES subproject (subproject_id),
    PRIMARY KEY (polygon_id, subproject_id)
);

CREATE TABLE polygon(
    polygon_id SERIAL PRIMARY KEY,
    coordinatesjson TEXT,
    name VARCHAR(100),
    insertion_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP (0) -- 0 for no miliseconds
);

CREATE TABLE polygon_polygoncategory(
    polygon_id INT REFERENCES polygon (polygon_id),
    polygoncategory_id VARCHAR(50) REFERENCES polygoncategory,
    PRIMARY KEY (polygon_id, polygoncategory_id)
);

CREATE TABLE polygoncategory(
    polygoncategory_id VARCHAR(50) PRIMARY KEY
);

CREATE TABLE role (
    role_id VARCHAR(50) PRIMARY KEY,
    descr TEXT
);

CREATE TABLE bruger(
    username VARCHAR(50) PRIMARY KEY
);

CREATE TABLE user_project_role(
    username VARCHAR(50) REFERENCES bruger (username),
    project_id INT REFERENCES project (project_id),
    role_id VARCHAR(50) REFERENCES role (role_id),
    PRIMARY KEY (username, project_id, role_id)
);