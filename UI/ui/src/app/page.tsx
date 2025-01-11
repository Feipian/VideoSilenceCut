import Link from "next/link"
import styles from "./pages.module.scss"

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.functionBox}>
        <div className={styles.functionBox_title}>
          <h2>Kits</h2>
        </div>

        <div className={styles.functionBox_Content_Block}>
          <Link href={"/videoAudioCut"} className={styles.functionBox_item}>
            Video & Audio Cut
          </Link>

          <div className={styles.functionBox_item}>
            Another Function
          </div>
        </div>

      </div>
    </div>
  );
}
