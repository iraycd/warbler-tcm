import * as React from 'react';
import * as TreeView from 'react-treeview'
import * as projectState from '../api/state/projects'
import * as scm from '../api/scm'
import * as path from 'path'
import * as dialogs from '../api/electron/dialogs'
import * as testPlanState from '../api/state/test-plan'

let styles = require('./ProjectSidebar.scss');

interface ProjectDetails {
  project: projectState.Project
  attachedProject: projectState.AttachedProject
}


export interface State {
  projectDetails: ProjectDetails[]

  // TODO make the loaded setting
  showDeleted: boolean
  showNonTestPlanFiles: boolean

  selectedFile: string | null
}

export default class ProjectSidebar extends React.Component<any, State> {
  private projectsUpdatedListener = (evt: projectState.AttachedProjectsUpdated) => { this.onProjectsUpdated(evt) }

  constructor(props: any) {
    super(props)
    this.state = {
      projectDetails: [],
      showDeleted: false,
      showNonTestPlanFiles: false,
      selectedFile: null
    }
    projectState.getAttachedProjects()
      .then((aps) => {
        return Promise.all(aps.map((ap): ProjectDetails => {
          return {
            project: new projectState.Project(ap),
            attachedProject: ap
          }
        }))
      })
      .then((pds) => {
        return Promise.all(pds.map((pd) => {
          return pd.project.refresh()
        }))
        .then(() => { return pds })
      })
      .then((pds) => {
        this.setState({ projectDetails: pds })
      })
  }

  render() {
    // TODO Clean up these buttons.

    return (
      <div className={styles.container} id='ProjectContainer'>
        <div className={styles.titlebar}>
          <span className={styles.title}>Projects</span>
          <span className={styles.titlebuttons}>
            <span className={styles.hamburger} onClick={() => { this.toggleSettings() }}>&nbsp;&nbsp;&nbsp;</span>
          </span>
        </div>
        <div className={styles.popup} id="settingsPopUp">
            <div className={styles.titlebutton} onClick={() => { this.addProject() }}>Add Project Folder</div>
            <div className={styles.titlebutton} onClick={() => { this.removeSelectedProject() }}>Remove Project Folder</div>
            <div onClick={() => { this.toggleShowNonTestPlanFiles() }}><span className={[styles.titlebutton,
              (this.state.showNonTestPlanFiles ? styles.enabled : styles.disabled)].join(' ')}>x</span><span>Show non-test plan files</span></div>
            <div className={[styles.titlebutton,
              (this.state.showDeleted ? styles.enabled : styles.disabled)]
              .join(' ')}
              onClick={() => { this.toggleShowDeletedFiles() }}>Show deleted files</div>
        </div>
        <div className={styles.treeContainer}>
        {this.state.projectDetails.map((pd) => { return this.renderProject(pd.project) })}
        </div>
      </div>
    );
  }

  renderProject(project: projectState.Project): JSX.Element {
    project.childProjects.sort((p1: projectState.Project, p2: projectState.Project) => {
      return strSort(p1.name, p2.name)})
    project.planFiles.sort((f1: scm.FileState, f2: scm.FileState) => {
      return strSort(f1.file, f2.file)})
    project.projectFiles.sort((f1: scm.FileState, f2: scm.FileState) => {
      return strSort(f1.file, f2.file)})
    // TODO: file / directory type should indicate the icon,
    // while the SCM type should indicate the color.
    let treeViewLabel = (<span
      onClick={() => { this.onProjectClicked(project, false) }}
      onDoubleClick={() => { this.onProjectClicked(project, true) }}>
      {project.name}
      </span>
    )
    return (
      <TreeView
            nodeLabel={treeViewLabel}
            defaultCollapsed={true}
            onClick={() => { this.onProjectClicked(project, false) }}
            onDoubleClick={() => { this.onProjectClicked(project, true) }}
            itemClassName={(this.state.selectedFile == project.rootFolder ? styles.selected : '')}>
          {project.childProjects.map((p) => { return this.renderProject(p) })}
          {this.renderPlanFiles(project)}
          {this.renderProjectFiles(project)}
      </TreeView>
    )
  }

  renderPlanFiles(project: projectState.Project) {
    return project.planFiles.map((f) => { return (
        <div
          onClick={() => { this.onPlanFileClicked(f) }}
          onDoubleClick={() => { this.onPlanFileClicked(f) }}
          className={[
            (this.state.selectedFile == f.file ? styles.selected : '')
          ].join(' ')}
          ><span className={styles.planFile}>{path.basename(f.file)}</span>
        </div>
      )})
  }

  renderProjectFiles(project: projectState.Project) {
    if (this.state.showNonTestPlanFiles) {
      return project.projectFiles.map((f) => { return (
            <div
              onClick={() => { this.onProjectFileClicked(project, f, false) }}
              onDoubleClick={() => { this.onProjectFileClicked(project, f, true) }}
              className={[
                (this.state.selectedFile == f.file ? styles.selected : '')
              ].join(' ')}
              ><span className={styles.projectFile}>{path.basename(f.file)}</span>
            </div>
      )})
    }
    return null
  }

  toggleSettings() {
    let el = document.getElementById('settingsPopUp');
    if (el) { el.classList.toggle(styles.show) }
  }

  closeSettingsPopup() {
    let el = document.getElementById('settingsPopUp');
    if (el) { el.classList.remove(styles.show) }
  }

  addProject() {
    this.closeSettingsPopup()
    dialogs.addProjectDialog()
  }

  removeSelectedProject() {
    this.closeSettingsPopup()
    console.log(`Remove selected project`)
  }

  toggleShowDeletedFiles() {
    this.closeSettingsPopup()
    this.setState({
      showDeleted: !this.state.showDeleted
    })
  }

  toggleShowNonTestPlanFiles() {
    this.closeSettingsPopup()
    this.setState({
      showNonTestPlanFiles: !this.state.showNonTestPlanFiles
    })
  }

  onProjectClicked(pd: projectState.Project, doubleClick: boolean) {
    console.log(`Clicked project ${pd.rootFolder}`)
    this.closeSettingsPopup()
    this.setState({
      selectedFile: pd.rootFolder
    })
    if (doubleClick) {
      projectState.sendRequestViewProjectDetails(pd.attached)
    }
  }

  onPlanFileClicked(file: scm.FileState) {
    this.closeSettingsPopup()
    this.setState({
      selectedFile: file.file
    })
    testPlanState.sendRequestViewTestPlan(file.file)
  }

  onProjectFileClicked(project: projectState.Project, file: scm.FileState, doubleClick: boolean) {
    this.closeSettingsPopup()
    console.log(`Clicked project ${doubleClick} ${project.rootFolder} ${file.file}`)
  }

  onProjectsUpdated(evt: projectState.AttachedProjectsUpdated) {
    this.closeSettingsPopup()
    Promise.all(evt.projects.map((prj: projectState.AttachedProject) => {
      return new projectState.Project(prj).refresh()
        .then((p): ProjectDetails => { return { attachedProject: prj, project: p }})
      })).then((pd: ProjectDetails[]) => {
      this.setState({
        projectDetails: pd
      })
    })
  }

  componentDidMount() {
    projectState.addAttachedProjectsUpdatedListener(this.projectsUpdatedListener)
  }

  componentWillUnmount() {
    projectState.removeAttachedProjectsUpdatedListener(this.projectsUpdatedListener)
  }
}

function strSort(s1: string, s2: string): number {
  return s1 == s2
    ? 0
    : s1 < s2
      ? -1
      : 1
}
