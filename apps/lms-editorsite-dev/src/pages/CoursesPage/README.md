# Courses page

The courses page is for admins and editors to create, edit or archive courses.

## Course structure

Each course is made up of:

**- Modules**

**- Units**

**- Assessments** 

**- Awards**

## Courses

- Courses are displayed in the courses catalogue pages of the learner site

- Each course has a course overview page
  
  - Requirements for this page are not listed here

   

### Creating a course

1. An editor goes to https://lmsed.365evergreendev.com/courses/new
   - Hard-coded URL for PoC
     - Future client sites will be ../editor/courses/new (or similar)
2. Selects Add course button
3. Properites are
   - Title
   - Slug (auto created from title)
   - Summary (1000 character limit)
   - Level (select)
     - Foundation (mandatory)
     - Beginner
     - Intermmediate
     - Advanced
   - Duration
     - Auto-calculated sum of all related module durations
   - Tags
     - Select existing (from select control)
         or, new tags can be added
   - Featured image
     - Select from media library or
     - Upload new
   - Role
     - is optional
   - Learning path
     - is optional
   - Is current
     - true/false
       - false means the course is no longer visible to the learners or public visitors
         - false means the course is visible to editors
         - editor's dashboard has access to archived courses
         - no archived course metadata are deleted from the Azure tables
         - no archived course content is deleted from the Azure Blob containers

### Editing a course

1. Editor goes to https://lmsed.365evergreendev.com/courses 
2. Selects course to edit
3. Can edit all same properties as the above for new courses

### Archiving a course

1. Editor goes to https://lmsed.365evergreendev.com/courses 
2. Selects course to archive
3. Switches toggle from true to false
   - false means the course is no longer visible to the learners
   - false means the course is visible to editors
     - editor's dashboard has access to archived courses
     - no archived course metadata are deleted from the Azure tables
     - no archived course content is deleted from the Azure Blob containers

## Modules

### Creating a module

- An editor goes to [365 Evergreen LMS admin portal](https://lmsed.365evergreendev.com/courses/new) and selects course
  - Hard-coded URL for PoC
    - Future client sites will be ../editor/courses/new (or similar)
- Selects Add module button
- Modal displays with form for module properties
  - Properites are
    - Title
    - Slug (auto created from title)
    - Summary (1000 character limit)
    - Duration
      - Auto-calculated sum of all related unit durations
    - Featured image
      - Select from media library or
      - Upload new
    - Is current
      - true/false
        - false means the module is no longer visible to the learners or public visitors
          - false means the module is visible to editors
          - editor's dashboard has access to archived modules
          - no archived modules metadata are deleted from the Azure tables
          - no archived module content is deleted from the Azure Blob containers
- Featured image
  - Select from media library or
  - Upload new

### Editing a module

- Editor goes to [365 Evergreen LMS admin portal](https://lmsed.365evergreendev.com/courses)
- Selects course to edit
- Can edit all same properties as the above for new courses

### Archiving a module

- Editor goes to [365 Evergreen LMS admin portal](https://lmsed.365evergreendev.com/courses)
- Selects module to archive
- Switches toggle from true to false
  - false means the module is no longer visible to the learners
  - false means the module is visible to editors
    - editor's dashboard has access to archived modules
    - no archived module metadata are deleted from the Azure tables
    - no archived module content is deleted from the Azure Blob containers

## Units

### Creating a unit

- An editor goes to [365 Evergreen LMS admin portal](https://lmsed.365evergreendev.com/courses/new) and selects course > module
  - Hard-coded URL for PoC
    - Future client sites will be ../editor/courses/new (or similar)
- Selects Add unit button
- Canvas editor displays with block palette, canvas and properties pane
- Properties are:
  - Title
  
  - Slug (auto created from title)
  - Summary (1000 character limit)
  - Duration
    - Integer
  - Is current
    - true/false
      - false means the unit is no longer visible to the learners or public visitors
        - false means the unit is visible to editors
        - editor's dashboard has access to archived units
        - no archived units metadata are deleted from the Azure tables
- All content blocks are available to add to the canvas
- Discard changes, save draft, publish, delete buttons all have the same confirm actions as other block canvases

### Editing a unit

- Editor goes to [365 Evergreen LMS admin portal](https://lmsed.365evergreendev.com/courses)
- Selects course to edit
- Can edit all same properties as the above for new units
- All content blocks are available to add to the canvas
- Discard changes, save draft, publish, delete buttons all have the same confirm actions as other block canvases

### Archiving a unit

- Editor goes to [365 Evergreen LMS admin portal](https://lmsed.365evergreendev.com/courses)
- Selects unit to archive
- Switches toggle from true to false
  - false means the unit is no longer visible to the learners
  - false means the unit is visible to editors
    - editor's dashboard has access to archived units
    - no archived unit metadata are deleted from the Azure tables
    - no archived unit content is deleted from the Azure Blob containers

## Assessments

TBC

### Creating an assessment



### Editing an assessment

### Archiving an assessment

- Editor goes to [365 Evergreen LMS admin portal](https://lmsed.365evergreendev.com/courses)
- Selects assessment to archive
- Switches toggle from true to false
  - false means the assessment is no longer visible to the learners
  - false means the asssessment is visible to editors
    - editor's dashboard has access to archived assessments
    - no archived assessment metadata are deleted from the Azure tables
    - no archived assessment content is deleted from the Azure Blob containers

## Awards

TBC